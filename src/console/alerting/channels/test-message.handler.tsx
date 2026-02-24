import { sendTelegramMessage } from "@/alerting/channels/telegram/sender";
import { withAuth } from "@/console/authenticated";
import { InvalidParameters } from "@/server/response";

function htmlSuccess(message: string) {
	return new Response(`<span class="text-emerald-400">${message}</span>`, {
		headers: { "Content-Type": "text/html" },
	});
}

function htmlError(message: string) {
	return new Response(`<span class="text-red-400">${message}</span>`, {
		headers: { "Content-Type": "text/html" },
	});
}

export const ChannelTestHandler = withAuth(async ({ req }) => {
	try {
		const formData = await req.formData();
		const type = formData.get("type")?.toString();

		if (!type) return InvalidParameters;

		const config: Record<string, any> = Object.create(null);
		for (const [key, value] of formData.entries()) {
			if (key.startsWith("config.")) {
				config[key.replace("config.", "")] = value;
			}
		}

		if (type === "telegram") {
			const token = config.token?.toString();
			const chatId = config.chatId?.toString();

			if (!token || !chatId) {
				return htmlError("Missing Telegram token or chat ID");
			}

			await sendTelegramMessage(
				{ token, chatId },
				"✅ Test message from Hyperion",
				{ retryAttemps: 0 },
			);
		}

		return htmlSuccess("Message sent successfully");
	} catch {
		return htmlError("Failed to send test message");
	}
});
