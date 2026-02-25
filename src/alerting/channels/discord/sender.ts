import { withRetry } from "../common/retry";

export type DiscordOptions = {
	webhookUrl: string;

	retryAttempts?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	rateLimitDelayMs?: number;
};

export type DiscordSendOptions = {
	username?: string;
	avatarUrl?: string;
	retryAttempts?: number;
};

export async function sendDiscordMessage(
	opts: DiscordOptions,
	content: string,
	sendOpts?: DiscordSendOptions,
) {
	const { webhookUrl, ...retryConfig } = opts;

	if (!webhookUrl) {
		throw new Error("Missing Discord webhook URL");
	}

	await withRetry(async () => {
		const res = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content,
				username: sendOpts?.username,
				avatar_url: sendOpts?.avatarUrl,
			}),
		});

		if (res.status === 429) {
			const data = await res.json().catch(() => null);
			const retryAfter =
				data?.retry_after != null ? Number(data.retry_after) : 1000;

			await Bun.sleep(retryAfter);
			throw new Error("Rate limited");
		}

		if (!res.ok) {
			throw new Error(`Discord ${res.status}: ${await res.text()}`);
		}
	}, retryConfig);
}
