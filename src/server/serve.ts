import { EntityDetailPage, EntityListPage } from "@/console/entity.pages";
import { loadExtraInfos } from "@/console/extra.infos";
import { LoginPage } from "@/console/login.page";
import { createHyperionDB, type HyperionDB } from "@/db";
import { openapi } from "@/openapi/gen.openapi";
import apiDocs from "@/static/scalar.html";
import { images } from "./assets/img";
import {
	getOwnerHashFromRequest,
	type JWKSSource,
	loadJWKS,
} from "./auth/jwks";
import { createAuthApi } from "./auth/stytch";
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
	const db = await createHyperionDB(dbPath ?? "./db");

	await loadJWKS(jwks);

	const networkInfos = await loadExtraInfos();
	const authApi = createAuthApi();

	const ctx = { db, networkInfos, authApi };

	const listener = Bun.serve({
		hostname,
		port,
		reusePort,

		routes: {
			"/": async (req) => EntityListPage(ctx, req),
			"/img/:name": ({ params }) => {
				const file = images[params.name];
				return file
					? new Response(file)
					: new Response("Not found", { status: 404 });
			},
			"/styles.css": Bun.file("./src/static/styles.min.css"),
			"/login": {
				GET: LoginPage,
				POST: authApi.login,
			},
			"/logout": authApi.logout,
			"/authenticate": authApi.authenticate,
			"/console/entities": async (req) => EntityListPage(ctx, req),
			"/console/entities/:id": async (req) => EntityDetailPage(ctx, req),
			"/uptime": () => Response.json({ ok: true, uptime: process.uptime() }),
			"/docs": apiDocs,
			"/openapi.json": () =>
				Response.json(openapi, {
					headers: { "Cache-Control": "public, max-age=3600" },
				}),
			// "/db/stats": () => Response.json(kvs.getStats()),
			"/v1/meta/networks": () => Response.json(db.getNetworksMeta()),
			"/v1/meta/categories": () => Response.json(db.getCategoriesMeta()),
			"/v1/public/address/:address/:network": (req) =>
				intel.getAddressByNetwork(db, req),
			"/v1/public/address/:address": (req) =>
				intel.getAddressAllNetworks(db, req),
			"/v1/public/category/:address/:cat/:subcat/:network": (req) =>
				intel.getAddressCategory(db, req),
			"/v1/public/tags/:address/:network": (req) =>
				intel.getAddressTags(db, req),
			"/v1/public/tag/:address/:tag/:network": (req) =>
				intel.getAddressTagByNetwork(db, req),
			"/v1/private/me": async (req) => {
				const ownerHash = await getOwnerHashFromRequest(req);
				if (ownerHash === null) return Unauthorized;
				return Response.json({
					hash: Buffer.from(ownerHash).toString("hex"),
				});
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
		db: db,
	};
}
