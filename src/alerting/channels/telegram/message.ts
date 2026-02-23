import { NetworkCache } from "@/console/network.cache";
import type { Alert } from "@/db";
import { escapeMarkdownV2 } from "./utils";

export function formatTelegramAlert(alert: Alert): string {
	const parts = alert.message.map(([, value]) => value).join(" ");
	const escapedMessage = escapeMarkdownV2(parts);

	const escapedRemark = alert.remark
		? escapeMarkdownV2(alert.remark)
		: undefined;

	const severity =
		alert.level === 3 ? "🔴 Critical" : alert.level === 2 ? "⚠️ Warning" : "ℹ️";

	let networkText = "";
	if (alert.networks?.length) {
		networkText = alert.networks
			.map((n) => NetworkCache.fromId(n.network)?.name ?? "Unknown")
			.join(" · ");

		networkText = ` ${escapeMarkdownV2(networkText)}`;
	}

	const lines = [
		`*${escapedMessage}*${networkText}`,
		"",
		`${severity}${escapedRemark ? ` _${escapedRemark}_` : ""}`,
	];

	return lines.join("\n");
}
