import type { TransferEvent } from "../../types";
import type { LocalData } from "./types";

export function mapTransferAlert(event: TransferEvent, local: LocalData) {
	const { from, to, fromFormatted, toFormatted, asset, amount, amountUsd } =
		event.payload;

	const assetsArray = (Array.isArray(asset) ? asset : [asset]).map((a, i) => ({
		id: a.id,
		symbol: a.symbol,
		decimals: a.decimals,
		amount: Array.isArray(amount) ? amount[i] : amount,
		usd: Array.isArray(amountUsd) ? amountUsd[i] : amountUsd,
	}));

	const totalUsd = assetsArray.reduce((sum, a) => sum + (a.usd ?? 0), 0);

	const fromEntity = local.entities[from];
	const toEntity = local.entities[to];

	const usdStr = totalUsd.toLocaleString(undefined, {
		maximumFractionDigits: 0,
	});

	let message = `Transfer of $${usdStr}`;
	if (fromEntity?.isExchange) {
		message += ` from ${fromEntity.exchangeName ?? "Exchange A"}`;
	}
	if (toEntity?.isExchange) {
		message += ` to ${toEntity.exchangeName ?? "Exchange B"}`;
	}

	const makeLabels = (entity: typeof fromEntity | undefined) =>
		[
			entity?.isExchange ? "exchange" : undefined,
			entity?.walletType,
			entity?.exchangeName,
		].filter(Boolean) as string[];

	return {
		message,
		actors: [
			{
				role: "from",
				address: from,
				address_formatted: fromFormatted,
				labels: makeLabels(fromEntity),
			},
			{
				role: "to",
				address: to,
				address_formatted: toFormatted,
				labels: makeLabels(toEntity),
			},
		],
		assets: assetsArray,
		totalUsd,
	};
}
