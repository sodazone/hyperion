import { analyzeAddress, analyzeAddressAllNetworks } from "@/api/analysis";
import { createDatabase, createHyperionDB, type HyperionDB } from "@/db";
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
	db: HyperionDB;
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
	const kvs = await createDatabase(dbPath);
	const db = createHyperionDB(kvs);
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
					return Response.json(kvs.getStats());
				},
			},
			"/v1/meta/networks": {
				GET: () => {
					return Response.json(db.getNetworksMeta());
				},
			},
			"/v1/meta/categories": {
				GET: () => {
					return Response.json(db.getCategoriesMeta());
				},
			},
			"/v1/public/address/:address/:network": {
				GET: (req) => {
					try {
						const { address, network } = req.params;
						const networkId = coerceNetworkId(network);
						if (!address || networkId === undefined) {
							return InvalidParameters;
						}

						if (
							!db.existsInCategory({
								address,
								networkId,
								categoryCode: 0,
							})
						) {
							return NotFound;
						}

						const result = analyzeAddress(db, address, networkId);
						return Response.json(result);
					} catch (err) {
						console.error(err);
						return InternalServerError;
					}
				},
			},
			"/v1/public/address/:address": {
				GET: async (req) => {
					try {
						const { address } = req.params;

						const result = await analyzeAddressAllNetworks(db, address);
						return Response.json(result);
					} catch (err) {
						console.error(err);
						return InternalServerError;
					}
				},
			},
			"/v1/public/category/:address/:cat/:subcat/:network": {
				GET: (req) => {
					try {
						const params = coerceCategoryParams(req.params);
						if (params instanceof Response) return params;

						const url = new URL(req.url);
						const exists = url.searchParams.get("exists") === "true";

						if (exists) {
							if (params.networkId === 0) {
								return InvalidParameters;
							}
							return new Response(null, {
								status: db.existsInCategory(params) ? 204 : 404,
							});
						}

						const entries = db.getCategories(params);

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
			"/v1/public/tags/:address/:network": {
				GET: (req) => {
					try {
						const { address, network } = req.params;
						const networkId = coerceNetworkId(network);

						if (!address || networkId === undefined || networkId === 0) {
							return InvalidParameters;
						}

						const entries = db.getTags({
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
			"/v1/public/tag/:address/:tag/:network": {
				GET: (req) => {
					try {
						const params = coerceTagParams(req.params);
						if (params instanceof Response) return params;

						const url = new URL(req.url);
						const exists = url.searchParams.get("exists") === "true";

						if (exists) {
							if (params.networkId === 0) {
								return InvalidParameters;
							}
							return new Response(null, {
								status: db.hasTag(params) ? 204 : 404,
							});
						}

						const result = db.getTag(params);

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
			"/v1/private/me": {
				GET: async (req) => {
					const ownerHash = await getOwnerHashFromRequest(req);
					if (ownerHash === null) return Unauthorized;
					return Response.json({
						hash: Buffer.from(ownerHash).toString("hex"),
					});
				},
			},
			"/v1/private/categories/:address/:cat/:subcat/:network": {
				GET: async (req) => {
					try {
						const ownerHash = await getOwnerHashFromRequest(req);
						if (ownerHash === null) return Unauthorized;

						const params = coerceCategoryParams(req.params);
						if (params instanceof Response) return params;

						const url = new URL(req.url);
						const exists = url.searchParams.get("exists") === "true";

						if (exists) {
							if (params.networkId === 0) {
								return InvalidParameters;
							}
							return new Response(null, {
								status: db.existsInCategory({ ...params, owner: ownerHash })
									? 204
									: 404,
							});
						}

						const entries = db.getCategories({
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

					const result = await db.putCategory(
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

					const result = await db.deleteCategory({
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

			kvs.close();
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
		db: db,
	};
}
