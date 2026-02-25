import type { Alert } from "@/db";
import { formatTelegramAlert } from "./message";
import {
	sendTelegramMessage,
	type TelegramOptions,
	type TelegramSendOptions,
} from "./sender";

export async function notifyTelegram(
	opts: TelegramOptions,
	alert: Alert,
	sendOpts?: TelegramSendOptions,
) {
	const message = formatTelegramAlert(alert);
	await sendTelegramMessage(opts, message, sendOpts);
}
