import { createDatabase, createHyperionApi } from "@/db";

const db = createDatabase("./.db/current");
const api = createHyperionApi(db);

const MAX_ROUTE_LENGTH = 200;

function extractPath(rawUrl: string) {
	const schemeIndex = rawUrl.indexOf("://");
	if (schemeIndex !== -1) {
		const pathStart = rawUrl.indexOf("/", schemeIndex + 3);
		return pathStart === -1 ? "/" : rawUrl.slice(pathStart);
	}
	return rawUrl;
}

Bun.serve({
	hostname: "localhost",
	port: 8080,
	reusePort: true,

	async fetch(req) {
		try {
			if (req.method !== "GET") {
				return new Response("Method Not Allowed\n", { status: 405 });
			}

			if (req.url.length > MAX_ROUTE_LENGTH) {
				return new Response("Route too long\n", { status: 400 });
			}

			const path = decodeURIComponent(extractPath(req.url)).replace(
				/^\/+|\/+$/g,
				"",
			);
			const parts = path.split("/");

			if (parts.length === 0 || !parts[0]) {
				return new Response("Missing command\n", { status: 400 });
			}

			const command = parts[0].toLowerCase();

			switch (command) {
				case "ping":
					return new Response("PONG\n", {
						status: 200,
						headers: { "Content-Type": "text/plain" },
					});

				case "status":
					return new Response(
						JSON.stringify({ ok: true, uptime: process.uptime() }),
						{ status: 200, headers: { "Content-Type": "application/json" } },
					);

				// /sanctions/<network>/<address>
				case "sanctions": {
					const network = parts[1];
					const address = parts[2];

					if (!network || !address) {
						return new Response("Missing or invalid network/address\n", {
							status: 400,
						});
					}

					const result = api.existsInCategory({
						address,
						network,
						categoryCode: 0x0004,
					});

					return new Response(JSON.stringify({ result }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}

				case "cats": {
					const network = parts[1];
					const address = parts[2];

					if (!network || !address) {
						return new Response("Missing or invalid network/address\n", {
							status: 400,
						});
					}

					const result = api.getAllCategories({
						address,
						network,
					});

					return new Response(JSON.stringify({ result }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}

				default:
					return new Response("Not found", {
						status: 404,
						headers: { "Content-Type": "text/plain" },
					});
			}
		} catch (err) {
			console.error("Error handling request:", err);
			return new Response("Internal Server Error\n", { status: 500 });
		}
	},
});

console.log("HTTP server running on http://localhost:8080");
