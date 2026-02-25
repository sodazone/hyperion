import type { Alert } from "@/db";
import { formatDiscordAlert } from "./message";
import {
	type DiscordOptions,
	type DiscordSendOptions,
	sendDiscordMessage,
} from "./sender";

export async function notifyTelegram(
	opts: DiscordOptions,
	alert: Alert,
	sendOpts?: DiscordSendOptions,
) {
	const message = formatDiscordAlert(alert);
	await sendDiscordMessage(opts, message, sendOpts);
}
