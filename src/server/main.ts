import { createDatabase, createHyperionApi } from "@/db";
import { VERSION } from "@/version";
import { coercePublicCategoryParams } from "./path";

const db = createDatabase("./.db/current");
const api = createHyperionApi(db);

const listener = Bun.serve({
	hostname: "localhost",
	port: 8080,
	reusePort: true,

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
		"/pub/cat/:cat/:subcat/:address/:network/data": {
			GET: (req) => {
				try {
					const params = coercePublicCategoryParams(req.params);
					if (params instanceof Response) return params;

					const entries = api.getCategories(params);

					if (entries) {
						return Response.json({ entries });
					} else {
						return new Response(null, {
							status: 404,
						});
					}
				} catch (err) {
					console.error("Route error:", err);
					return new Response("Internal Server Error\n", { status: 500 });
				}
			},
		},
		"/pub/cat/:cat/:subcat/:address/:network": {
			GET: (req) => {
				try {
					const params = coercePublicCategoryParams(req.params);
					if (params instanceof Response) return params;

					return new Response(null, {
						status: api.existsInCategory(params) ? 204 : 404,
					});
				} catch (err) {
					console.error("Route error:", err);
					return new Response("Internal Server Error\n", { status: 500 });
				}
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
