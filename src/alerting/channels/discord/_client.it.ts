import { initNetworkCache } from "@/console/network.cache";
import { createAlertingDB, PUBLIC_OWNER } from "@/db";
import { notifyDiscord } from "./notify";

const webhookUrl = Bun.env.DISCORD_WEBHOOK_URL;

if (webhookUrl === undefined) {
	console.log("Please provide DISCORD_WEBHOOK_URL");
	process.exit(-1);
}

const opts = { webhookUrl };

await initNetworkCache();

const db = await createAlertingDB("./.db/current");
const alert = db.alerts.findAlerts({ owner: PUBLIC_OWNER, limit: 1 }).rows[0];
if (alert)
	notifyDiscord(opts, alert, {
		username: "Hyperion",
		avatarUrl:
			"https://tf-prod-bunny-pullzone-1.gooddog.com/images/iuqaJj7Uq2FPgn2UtPz2TFEr/pug.jpg?crop=256x256",
	});
