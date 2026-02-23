type TelegramOptions = {
	token: string;
	chatId: string;
	apiBase?: string;

	retryAttempts?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	rateLimitDelayMs?: number;
};

type SendOptions = {
	disablePreview?: boolean;
};

type QueueItem = {
	text: string;
	opts?: SendOptions;
	attempt: number;
};

export class TelegramSender {
	private token: string;
	private chatId: string;
	private apiBase: string;

	private retryAttempts: number;
	private baseDelayMs: number;
	private maxDelayMs: number;
	private rateLimitDelayMs: number;

	private queue: QueueItem[] = [];
	private processing = false;

	constructor(opts: TelegramOptions) {
		this.token = opts.token;
		this.chatId = opts.chatId;
		this.apiBase = opts.apiBase ?? "https://api.telegram.org";

		this.retryAttempts = opts.retryAttempts ?? 5;
		this.baseDelayMs = opts.baseDelayMs ?? 500;
		this.maxDelayMs = opts.maxDelayMs ?? 10_000;
		this.rateLimitDelayMs = opts.rateLimitDelayMs ?? 50;
	}

	private endpoint(method: string) {
		return `${this.apiBase}/bot${this.token}/${method}`;
	}

	async send(text: string, opts?: SendOptions) {
		this.queue.push({
			text,
			opts,
			attempt: 0,
		});

		if (!this.processing) {
			this.processQueue();
		}
	}

	private async processQueue() {
		this.processing = true;

		while (this.queue.length > 0) {
			const item = this.queue.shift();
			try {
				if (item !== undefined) {
					await this.executeSend(item);
					await Bun.sleep(this.rateLimitDelayMs);
				}
			} catch (err) {
				console.error("Telegram send failed permanently:", err);
			}
		}

		this.processing = false;
	}

	private async executeSend(item: QueueItem): Promise<void> {
		try {
			await this.rawSend(item.text, item.opts);
		} catch (err: any) {
			if (item.attempt >= this.retryAttempts) {
				throw err;
			}

			item.attempt++;

			const delay = this.computeBackoff(item.attempt);

			console.warn(
				`Telegram retry ${item.attempt}/${this.retryAttempts} in ${delay}ms`,
				err,
				item.text,
			);

			await Bun.sleep(delay);

			return this.executeSend(item);
		}
	}

	private async rawSend(text: string, opts?: SendOptions) {
		const body = {
			chat_id: this.chatId,
			text,
			parse_mode: "MarkdownV2",
			disable_web_page_preview: opts?.disablePreview ?? true,
		};

		const res = await fetch(this.endpoint("sendMessage"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (res.status === 429) {
			const data = await res.json().catch(() => null);
			const retryAfter = data?.parameters?.retry_after
				? data.parameters.retry_after * 1000
				: 1000;

			console.warn(`Telegram rate limited. Retry after ${retryAfter}ms`);
			await Bun.sleep(retryAfter);
			throw new Error("Rate limited");
		}

		if (!res.ok) {
			const errText = await res.text();
			throw new Error(`Telegram ${res.status}: ${errText}`);
		}
	}

	private computeBackoff(attempt: number) {
		const delay = this.baseDelayMs * 2 ** (attempt - 1);
		return Math.min(delay, this.maxDelayMs);
	}
}
