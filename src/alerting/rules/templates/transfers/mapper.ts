import type { AlertMessagePart } from "@/db";
import { CAT } from "@/intel/mapping";
import { formatNumberSI, toDecimal } from "@/utils/amounts";
import type { TransferEvent } from "../../types";
import { getName, makeLabels } from "../common/helpers";
import type { LocalData } from "./schema";

export function mapTransferAlert(event: TransferEvent, local: LocalData) {
	const { from, to, assets, totalUsd } = event.payload;

	const fromEntity = local.entities[from.address];
	const toEntity = local.entities[to.address];

	const usdStr = `$${formatNumberSI(totalUsd, 2)}`;
	const assetParts = assets.flatMap(
		(a) =>
			[
				["a", formatNumberSI(toDecimal(a))],
				["t", a.symbol],
			] as AlertMessagePart[],
	);

	const message: AlertMessagePart[] = [
		["t", "Transfer of"],
		...assetParts,
		["a", `(${usdStr})`],
	];

	const fromName = getName(fromEntity);
	const toName = getName(toEntity);

	if (fromName !== undefined || toName !== undefined) {
		if (fromName === toName) {
			message.push(
				["t", "between"],
				[
					fromEntity?.categories?.includes(CAT.EXCHANGE) ? "cex" : "e",
					fromName ?? toName ?? "",
				],
			);
		} else {
			console.log(fromName, toName);
			if (fromName)
				message.push(
					["t", "from"],
					[
						fromEntity?.categories?.includes(CAT.EXCHANGE) ? "cex" : "e",
						fromName,
					],
				);
			if (toName)
				message.push(
					["t", "to"],
					[toEntity?.categories?.includes(CAT.EXCHANGE) ? "cex" : "e", toName],
				);
		}
	}

	return {
		message,
		actors: [
			{
				role: "from",
				address: from.address,
				address_formatted: from.addressFormatted ?? from.address,
				labels: makeLabels(fromEntity),
			},
			{
				role: "to",
				address: to.address,
				address_formatted: to.addressFormatted ?? to.address,
				labels: makeLabels(toEntity),
			},
		],
		assets,
		totalUsd,
	};
}
