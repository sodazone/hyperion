import path from "node:path";

import { createMonitorFromDB } from "@/alerting/monitor";
import type { CreateStreamsClient } from "@/alerting/streams/ocelloids";
import {
	ChannelsConfigFragment,
	ChannelsFragment,
} from "@/console/alerting/channels/fragments";
import {
	ChannelFormPage,
	ChannelListPage,
} from "@/console/alerting/channels/pages";
import { ChannelTestHandler } from "@/console/alerting/channels/test-message.handler";
import {
	MyAlertListPage,
	MyAlertListPoller,
	RuleFormPage,
	RuleListPage,
} from "@/console/alerting/owned/pages";
import {
	AlertListPage,
	AlertListPoller,
} from "@/console/alerting/public/pages";
import { LatestAlertsFragment } from "@/console/analytics/alerts.latest";
import { TopExchangesFragment } from "@/console/analytics/cex.top";
import { DashboardPage } from "@/console/analytics/pages";
import { CrosschainSolvencyFragment } from "@/console/analytics/xc.solvency";
import {
	WatchlistCategoryRowPage,
	WatchlistFormPage,
	WatchlistPage,
	WatchlistTagRowPage,
} from "@/console/entities/owned/pages";
import {
	EntityDetailPage,
	EntityListPage,
} from "@/console/entities/public/pages";
import { getNetworkIconFile } from "@/console/extra.infos";
import { LoginPage } from "@/console/login.page";
import { initNetworkCache } from "@/console/network.cache";
import { createHyperionDB, type HyperionDB } from "@/db";
import { openapi } from "@/openapi/gen.openapi";
import { VERSION } from "@/version";
import apiDocs from "../../public/scalar.html";
import {
	ChannelDeleteHandler,
	ChannelPostHandler,
	ChannelPutHandler,
} from "../console/alerting/channels/handlers";
import { TagsFragment } from "../console/alerting/owned/fragments";
import {
	RuleDeleteHandler,
	RuleUpsertHandler,
} from "../console/alerting/owned/handlers";
import { CexSeriesHandler } from "../console/analytics/cex.handler";
import {
	WatchlistDeleteHandler,
	WatchlistPostHandler,
} from "../console/entities/owned/forms";
import { intel } from "./api/routes";
import { images } from "./assets/img";
import { type JWKSSource, loadJWKS, withOwnerFromJWT } from "./auth/jwks";
import { createAuthApi } from "./auth/stytch";
import { createMetrics } from "./metrics";
import { Forbidden, NotFound } from "./response";

export type Serve = {
	shutdown: (signal: string) => Promise<void>;
	db: HyperionDB;
};

export async function serve({
	dbPath,
	jwks,
	createStreamsClient,
	port = 8080,
	hostname = "localhost",
	reusePort = true,
}: Bun.Serve.HostnamePortServeOptions<unknown> & {
	dbPath?: string;
	jwks?: JWKSSource;
	createStreamsClient?: CreateStreamsClient;
}): Promise<Serve> {
	const metrics = createMetrics();

	const db = await createHyperionDB(dbPath ?? "./db");

	await loadJWKS(jwks);

	await initNetworkCache();

	const authApi = createAuthApi();

	const monitor = await createMonitorFromDB(db, metrics, createStreamsClient);
	await monitor.start();

	const ctx = Object.freeze({ db, authApi, monitor });

	const jsPath = path.resolve("./public/js");

	const listener = Bun.serve({
		hostname,
		port,
		reusePort,

		routes: {
			"/": async (req) => DashboardPage(ctx, req),
			"/img/:name": ({ params }) => {
				const file = images[params.name];
				return file
					? new Response(file)
					: new Response("Not found", { status: 404 });
			},
			"/img/networks/:name": ({ params }) => {
				const file = getNetworkIconFile(params.name);

				if (!file) {
					return new Response("Not found", { status: 404 });
				}

				return new Response(file, {
					headers: {
						"Cache-Control": "public, max-age=31536000, immutable",
					},
				});
			},
			"/assets/styles.css": Bun.file("./public/styles.min.css"),
			"/assets/js/*": (req) => {
				const url = new URL(req.url);
				const safePath = path.normalize(url.pathname.replace("/assets/js", ""));
				const filePath = path.resolve(path.join("./public/js", safePath));
				if (!filePath.startsWith(jsPath)) {
					return Forbidden;
				}
				try {
					return new Response(Bun.file(filePath), {
						headers: {
							"Content-Type": "application/javascript",
							"Cache-Control": "public, max-age=31536000, immutable",
						},
					});
				} catch {
					return NotFound;
				}
			},
			"/metrics": async () =>
				new Response(await metrics.register.metrics(), {
					headers: { "Content-Type": metrics.register.contentType },
				}),
			"/login": {
				GET: LoginPage,
				POST: authApi.login,
			},
			"/logout": authApi.logout,
			"/authenticate": authApi.authenticate,
			"/console": async (req) => DashboardPage(ctx, req),
			"/console/dashboard": async (req) => DashboardPage(ctx, req),
			"/console/dashboard/fragments/top-exchanges": async (req) =>
				TopExchangesFragment(ctx, req),
			"/console/dashboard/fragments/latest-alerts": async (req) =>
				LatestAlertsFragment(ctx, req),
			"/console/dashboard/fragments/xc-solvency": async (req) =>
				CrosschainSolvencyFragment(ctx, req),
			"/console/public/alerts": async (req) => AlertListPage(ctx, req),
			"/console/public/alerts/$": async (req) => AlertListPoller(ctx, req),
			"/console/my/alerts": async (req) => MyAlertListPage(ctx, req),
			"/console/my/alerts/$": async (req) => MyAlertListPoller(ctx, req),
			"/console/channels": {
				GET: async (req) => ChannelListPage(ctx, req),
				PUT: async (req) => ChannelPutHandler(ctx, req),
				POST: async (req) => ChannelPostHandler(ctx, req),
			},
			"/console/channels/:id": {
				DELETE: async (req) => ChannelDeleteHandler(ctx, req),
			},
			"/console/channels/form/:id": async (req) => ChannelFormPage(ctx, req),
			"/console/channels/config": async (req) =>
				ChannelsConfigFragment(ctx, req),
			"/console/channels/options": async (req) => ChannelsFragment(ctx, req),
			"/console/channels/test": async (req) => ChannelTestHandler(ctx, req),
			"/console/rules": {
				GET: async (req) => RuleListPage(ctx, req),
				POST: async (req) => RuleUpsertHandler(ctx, req),
				PUT: async (req) => RuleUpsertHandler(ctx, req),
			},
			"/console/rules/:id": {
				DELETE: async (req) => RuleDeleteHandler(ctx, req),
			},
			"/console/rules/form/:id": async (req) => RuleFormPage(ctx, req),
			"/console/entities/tags/options": async (req) => TagsFragment(ctx, req),
			"/console/entities": async (req) => EntityListPage(ctx, req),
			"/console/entities/:id": async (req) => EntityDetailPage(ctx, req),
			"/console/watchlist": {
				GET: async (req) => WatchlistPage(ctx, req),
				POST: async (req) => WatchlistPostHandler(ctx, req),
				PUT: async (req) => WatchlistPostHandler(ctx, req),
			},
			"/console/watchlist/:address": {
				DELETE: async (req) => WatchlistDeleteHandler(ctx, req),
			},
			"/console/watchlist/form/:address": async (req) =>
				WatchlistFormPage(ctx, req),
			"/console/watchlist/form/rows/tag": async (req) =>
				WatchlistTagRowPage(ctx, req),
			"/console/watchlist/form/rows/category": async (req) =>
				WatchlistCategoryRowPage(ctx, req),
			"/uptime": () => Response.json({ ok: true, uptime: process.uptime() }),
			"/api-docs": apiDocs,
			"/openapi.json": () =>
				Response.json(openapi, {
					headers: { "Cache-Control": "public, max-age=3600" },
				}),
			// "/db/stats": () => Response.json(kvs.getStats()),
			"/v1": () =>
				Response.json({ ok: true, version: `Hyperion API v${VERSION}` }),
			"/v1/meta/networks": () => Response.json(db.meta.getNetworksMeta()),
			"/v1/meta/categories": () => Response.json(db.meta.getCategoriesMeta()),
			"/v1/analytics/cex_flows": (req) => CexSeriesHandler(ctx, req),
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
			"/v1/private/me": async (req) =>
				withOwnerFromJWT(req, async (owner) =>
					Response.json({
						hash: Buffer.from(owner).toString("hex"),
					}),
				),
			"/v1/private/category/:address/:cat/:subcat/:network": {
				GET: async (req) =>
					withOwnerFromJWT(req, async (owner) =>
						intel.owned.getCategory(owner, db, req),
					),
				POST: async (req) =>
					withOwnerFromJWT(req, async (owner) =>
						intel.owned.postCategory(owner, db, req),
					),
				DELETE: async (req) =>
					withOwnerFromJWT(req, async (owner) =>
						intel.owned.deleteCategory(owner, db, req),
					),
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

			await monitor.stop();
			console.log("Monitor stopped");

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
