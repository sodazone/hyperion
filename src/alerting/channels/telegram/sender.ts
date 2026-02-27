import { withRetry } from "../common/retry";

export type TelegramOptions = {
	token: string;
	chatId: string;
	apiBase?: string;

	retryAttempts?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	rateLimitDelayMs?: number;
};

export type TelegramSendOptions = {
	disablePreview?: boolean;
	retryAttempts?: number;
};

export async function sendTelegramMessage(
	opts: TelegramOptions,
	text: string,
	sendOpts?: TelegramSendOptions,
) {
	const {
		token,
		chatId,
		apiBase = "https://api.telegram.org",
		...retryConfig
	} = opts;

	if (!token || !chatId) {
		throw new Error("Missing Telegram token or chatId");
	}

	await withRetry(async () => {
		const res = await fetch(`${apiBase}/bot${token}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text,
				parse_mode: "MarkdownV2",
				disable_web_page_preview: sendOpts?.disablePreview ?? true,
			}),
		});

		if (res.status === 429) {
			const data = await res.json().catch(() => null);
			const retryAfter = data?.parameters?.retry_after
				? data.parameters.retry_after * 1000
				: 1000;

			await Bun.sleep(retryAfter);
			throw new Error("Rate limited");
		}

		if (!res.ok) {
			throw new Error(`Telegram ${res.status}: ${await res.text()}`);
		}
	}, retryConfig);
}
