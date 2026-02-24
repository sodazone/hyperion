import type { Alert } from "@/db";
import { formatTelegramAlert } from "./message";
import {
	type SendOptions,
	sendTelegramMessage,
	type TelegramOptions,
} from "./sender";

export async function notifyTelegram(
	opts: TelegramOptions,
	alert: Alert,
	sendOpts?: SendOptions,
) {
	const message = formatTelegramAlert(alert);
	await sendTelegramMessage(opts, message, sendOpts);
}
