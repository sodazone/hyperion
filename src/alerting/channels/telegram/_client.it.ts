import { initNetworkCache } from "@/console/network.cache";
import { type Alert, createAlertingDB, PUBLIC_OWNER } from "@/db";
import { formatTelegramAlert } from "./message";
import { TelegramSender } from "./sender";

const token = Bun.env.TG_TOKEN;
const chatId = Bun.env.TG_CHAT_ID;

if (token === undefined || chatId === undefined) {
	console.log("Please provide TG_TOKEN and TG_CHAT_ID");
	process.exit(-1);
}

const telegram = new TelegramSender({
	token,
	chatId,
});

export async function notifyTelegram(alert: Alert) {
	const message = formatTelegramAlert(alert);
	await telegram.send(message);
}

await initNetworkCache();

const db = await createAlertingDB("./.db/current");
const alert = db.alerts.findAlerts({ owner: PUBLIC_OWNER, limit: 1 }).rows[0];
if (alert) notifyTelegram(alert);
