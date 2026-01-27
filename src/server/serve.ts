import { createDatabase, createHyperionDB, type HyperionDB } from "@/db";
import { openapi } from "@/openapi/gen.openapi";
import { VERSION } from "@/version";
import { getOwnerHashFromRequest, type JWKSSource, loadJWKS } from "./auth";
import { intel } from "./intel/routes";
import { Unauthorized } from "./response";

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
					return intel.getAddressByNetwork(db, req);
				},
			},
			"/v1/public/address/:address": {
				GET: (req) => {
					return intel.getAddressAllNetworks(db, req);
				},
			},
			"/v1/public/category/:address/:cat/:subcat/:network": {
				GET: (req) => {
					return intel.getAddressCategory(db, req);
				},
			},
			"/v1/public/tags/:address/:network": {
				GET: (req) => {
					return intel.getAddressTags(db, req);
				},
			},
			"/v1/public/tag/:address/:tag/:network": {
				GET: (req) => {
					return intel.getAddressTagByNetwork(db, req);
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
			"/v1/private/category/:address/:cat/:subcat/:network": {
				GET: async (req) => {
					return await intel.owned.getCategory(db, req);
				},
				POST: async (req) => {
					return await intel.owned.postCategory(db, req);
				},
				DELETE: async (req) => {
					return await intel.owned.deleteCategory(db, req);
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
