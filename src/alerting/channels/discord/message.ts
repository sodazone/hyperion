import { NetworkCache } from "@/console/network.cache";
import type { Alert } from "@/db";

function escapeDiscord(text: string) {
	return text.replace(/@/g, "@\u200b").replace(/```/g, "`\u200b``");
}

export function formatDiscordAlert(alert: Alert): string {
	const parts = alert.message.map(([, value]) => value).join(" ");
	const message = escapeDiscord(parts);

	const remark = alert.remark ? escapeDiscord(alert.remark) : undefined;

	const severity =
		alert.level === 3
			? "🔴 **Critical**"
			: alert.level === 2
				? "⚠️ **Warning**"
				: "ℹ️ **Info**";

	let networkText = "";
	if (alert.networks?.length) {
		networkText = alert.networks
			.map((n) => NetworkCache.fromId(n.network)?.name ?? "Unknown")
			.join(" · ");
	}

	const lines = [
		`**${message}**${networkText ? ` · ${networkText}` : ""}`,
		"",
		`${severity}${remark ? ` *${remark}*` : ""}`,
	];

	return lines.join("\n");
}
