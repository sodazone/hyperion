import { formatNumberSI, toDecimal } from "@/utils/amounts";
import type { TransferEvent } from "../../types";
import { getName, makeLabels } from "../common/helpers";
import type { LocalData } from "./schema";

export function mapTransferAlert(event: TransferEvent, local: LocalData) {
	const { from, to, fromFormatted, toFormatted, asset, amount, amountUsd } =
		event.payload;

	// normalize assets array
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

	const usdStr = `$${formatNumberSI(totalUsd, 0)}`;
	const assetStr = assetsArray
		.map((a) => `${formatNumberSI(toDecimal(a))} ${a.symbol}`)
		.join(", ");

	let message = `Transfer of ${assetStr} (${usdStr})`;

	const fromName = getName(fromEntity);
	const toName = getName(toEntity);

	if (fromName) message += ` from ${fromName}`;
	if (toName) message += ` to ${toName}`;

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
