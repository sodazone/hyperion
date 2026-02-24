export type TelegramOptions = {
	token: string;
	chatId: string;
	apiBase?: string;

	retryAttempts?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	rateLimitDelayMs?: number;
};

export type SendOptions = {
	disablePreview?: boolean;
	retryAttemps?: number;
};

const DEFAULTS = {
	apiBase: "https://api.telegram.org",
	retryAttempts: 5,
	baseDelayMs: 500,
	maxDelayMs: 10_000,
	rateLimitDelayMs: 50,
};

function endpoint(apiBase: string, token: string, method: string) {
	return `${apiBase}/bot${token}/${method}`;
}

function computeBackoff(
	attempt: number,
	baseDelayMs: number,
	maxDelayMs: number,
) {
	const delay = baseDelayMs * 2 ** (attempt - 1);
	return Math.min(delay, maxDelayMs);
}

async function sleep(ms: number) {
	return Bun.sleep(ms);
}

export async function sendTelegramMessage(
	opts: TelegramOptions,
	text: string,
	sendOpts?: SendOptions,
): Promise<void> {
	const {
		token,
		chatId,
		apiBase = DEFAULTS.apiBase,
		retryAttempts = sendOpts?.retryAttemps ?? DEFAULTS.retryAttempts,
		baseDelayMs = DEFAULTS.baseDelayMs,
		maxDelayMs = DEFAULTS.maxDelayMs,
		rateLimitDelayMs = DEFAULTS.rateLimitDelayMs,
	} = opts;

	if (!token || !chatId) {
		throw new Error("Missing Telegram token or chatId");
	}

	let attempt = 0;

	while (true) {
		try {
			await rawSend({
				apiBase,
				token,
				chatId,
				text,
				sendOpts,
			});

			if (rateLimitDelayMs > 0) {
				await sleep(rateLimitDelayMs);
			}

			return;
		} catch (err: any) {
			if (attempt >= retryAttempts) {
				throw err;
			}

			attempt++;

			const delay = computeBackoff(attempt, baseDelayMs, maxDelayMs);

			console.warn(
				`Telegram retry ${attempt}/${retryAttempts} in ${delay}ms`,
				err?.message,
			);

			await sleep(delay);
		}
	}
}

async function rawSend(params: {
	apiBase: string;
	token: string;
	chatId: string;
	text: string;
	sendOpts?: SendOptions;
}) {
	const { apiBase, token, chatId, text, sendOpts } = params;

	const body = {
		chat_id: chatId,
		text,
		parse_mode: "MarkdownV2",
		disable_web_page_preview: sendOpts?.disablePreview ?? true,
	};

	const res = await fetch(endpoint(apiBase, token, "sendMessage"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (res.status === 429) {
		const data = await res.json().catch(() => null);
		const retryAfter = data?.parameters?.retry_after
			? data.parameters.retry_after * 1000
			: 1000;

		await sleep(retryAfter);
		throw new Error("Rate limited");
	}

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Telegram ${res.status}: ${errText}`);
	}
}
