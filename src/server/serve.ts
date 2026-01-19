import { createDatabase, createHyperionApi, type HyperionApi } from "@/db";
import { openapi } from "@/openapi/gen.openapi";
import { VERSION } from "@/version";
import { getOwnerHashFromRequest, type JWKSSource, loadJWKS } from "./auth";
import { coerceCategoryParams, coerceNetworkId, coerceTagParams } from "./path";
import {
	InternalServerError,
	InvalidParameters,
	NotFound,
	Unauthorized,
} from "./response";

export type Serve = {
	shutdown: (signal: string) => Promise<void>;
	api: HyperionApi;
};

export async function serve({
	dbPath,
	jwks,
	port = 8080,
	hostname = "localhost",
	reusePort = true,
}: Bun.Serve.HostnamePortServeOptions<unknown> & {
	dbPath?: string;
	jwks?: JWKSSource;
}): Promise<Serve> {
	const db = await createDatabase(dbPath);
	const api = createHyperionApi(db);
	const scalarHtml = Bun.file("./src/static/scalar.html");

	await loadJWKS(jwks);

	const listener = Bun.serve({
		hostname,
		port,
		reusePort,

		routes: {
			"/": {
				GET: () => {
					return Response.json(`Hyperion API v${VERSION}\n`);
				},
			},
			"/uptime": {
				GET: () => {
					return Response.json({ ok: true, uptime: process.uptime() });
				},
			},
			"/docs": {
				GET: () =>
					new Response(scalarHtml, {
						headers: { "Content-Type": "text/html" },
					}),
			},
			"/openapi.json": {
				GET: () =>
					Response.json(openapi, {
						headers: { "Cache-Control": "public, max-age=3600" },
					}),
			},
			"/db/stats": {
				GET: () => {
					return Response.json(db.getStats());
				},
			},
			"/meta/networks": {
				GET: () => {
					return Response.json(api.getNetworksMeta());
				},
			},
			"/meta/categories": {
				GET: () => {
					return Response.json(api.getCategoriesMeta());
				},
			},
			"/public/category/:cat/:subcat/:address/:network": {
				GET: (req) => {
					try {
						const params = coerceCategoryParams(req.params);
						if (params instanceof Response) return params;

						const url = new URL(req.url);
						const check = url.searchParams.get("check") === "true";

						if (check) {
							if (params.networkId === 0) {
								return new Response(
									"Invalid parameters. Network must be specified.",
									{
										status: 400,
									},
								);
							}
							return new Response(null, {
								status: api.existsInCategory(params) ? 204 : 404,
							});
						}

						const entries = api.getCategories(params);

						if (!entries || entries.length === 0) {
							return NotFound;
						}

						return Response.json(entries);
					} catch (err) {
						console.error("Route error:", err);
						return InternalServerError;
					}
				},
			},
			"/public/tags/:address/:network": {
				GET: (req) => {
					try {
						const { address, network } = req.params;
						const networkId = coerceNetworkId(network);

						if (!address || networkId === undefined) {
							return InvalidParameters;
						}

						const entries = api.getTags({
							address,
							networkId,
						});

						if (entries === undefined || entries.length === 0) {
							return NotFound;
						}

						return Response.json(entries);
					} catch (err) {
						console.error("Route error:", err);
						return InternalServerError;
					}
				},
			},
			"/public/tag/:tag/:address/:network": {
				GET: (req) => {
					try {
						const params = coerceTagParams(req.params);
						if (params instanceof Response) return params;

						const url = new URL(req.url);
						const check = url.searchParams.get("check") === "true";

						if (check) {
							return new Response(null, {
								status: api.hasTag(params) ? 204 : 404,
							});
						}

						const result = api.getTag(params);

						if (result === undefined) {
							return NotFound;
						}

						return Response.json(result);
					} catch (err) {
						console.error("Route error:", err);
						return InternalServerError;
					}
				},
			},
			"/me": {
				GET: async (req) => {
					const ownerHash = await getOwnerHashFromRequest(req);
					if (ownerHash === null) return Unauthorized;
					return Response.json({
						hash: Buffer.from(ownerHash).toString("hex"),
					});
				},
			},
			"/me/categories/:cat/:subcat/:address/:network": {
				GET: async (req) => {
					try {
						const ownerHash = await getOwnerHashFromRequest(req);
						if (ownerHash === null) return Unauthorized;

						const params = coerceCategoryParams(req.params);
						if (params instanceof Response) return params;

						const url = new URL(req.url);
						const check = url.searchParams.get("check") === "true";

						if (check) {
							return new Response(null, {
								status: api.existsInCategory({ ...params, owner: ownerHash })
									? 204
									: 404,
							});
						}

						const entries = api.getCategories({
							...params,
							owner: ownerHash,
						});

						if (entries) {
							return Response.json(entries);
						} else {
							return NotFound;
						}
					} catch (err) {
						console.error("Route error:", err);
						return InternalServerError;
					}
				},
				POST: async (req) => {
					const ownerHash = await getOwnerHashFromRequest(req);
					if (ownerHash === null) return Unauthorized;

					const params = coerceCategoryParams(req.params);
					if (params instanceof Response) return params;

					const body = await req.json();
					if (body instanceof Response) return body;

					const result = await api.putCategory(
						{ ...params, owner: ownerHash },
						body,
					);

					return Response.json(result);
				},
				DELETE: async (req) => {
					const ownerHash = await getOwnerHashFromRequest(req);
					if (ownerHash === null) return Unauthorized;

					const params = coerceCategoryParams(req.params);
					if (params instanceof Response) return params;

					const result = await api.deleteCategory({
						...params,
						owner: ownerHash,
					});

					return Response.json(result);
				},
			},
		},
	});

	let shuttingDown = false;

	async function shutdown(signal: string) {
		if (shuttingDown) return;
		shuttingDown = true;

		console.log(`\nReceived ${signal}, shutting down...`);

		try {
			listener.stop();
			console.log("HTTP server stopped");

			db.close();
			console.log("Database closed");

			process.exit(0);
		} catch (err) {
			console.error("Shutdown error:", err);
			process.exit(1);
		}
	}

	process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C
	process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker / systemd

	console.log(
		`Hyperion HTTP server running on ${listener.protocol}://${listener.hostname}:${listener.port}`,
	);

	return {
		shutdown,
		api,
	};
}
