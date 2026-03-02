import type { Alert, AlertPayload } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import { toDecimal } from "@/utils/amounts";
import type { IssuanceEvent, RuleDefinition } from "../../types";
import { type Config, schema } from "./schema";

const ruleName = "xc-invariant";

const defaults = {
	level: 1,
};

export interface CrosschainInvariantPayload extends AlertPayload {
	kind: "xc-invariant";
	reserve: {
		address: string;
		network: string;
		balance: number;
	};
	remote: {
		network: string;
		balance: number;
	};
	asset: {
		id: string;
		symbol: string;
	};
}

export const CrosschainInvariantRule: RuleDefinition<
	IssuanceEvent,
	{
		type: "deficit" | "surplus";
		difference: number;
	},
	Config
> = {
	id: ruleName,
	title: "Crosschain Invariant",
	description:
		"Alerts when crosschain reserve and remote balances diverge beyond thresholds.",
	schema,
	defaults,

	resolveDependencies: (instance) => {
		return [
			{
				kind: "issuance",
				subscriptionId: instance.config.subscriptionId,
			},
		];
	},

	matcher: async (event, { config }) => {
		if (
			event.type !== "issuance" ||
			event.payload.subscriptionId !== config.subscriptionId
		) {
			return { matched: false };
		}

		const reserveDecimals = event.payload.inputs.reserveDecimals;
		const remoteDecimals = event.payload.inputs.remoteDecimals;
		const remoteAmount = toDecimal({
			amount: event.payload.remote,
			decimals: remoteDecimals,
		});
		const reserveAmount = toDecimal({
			amount: event.payload.reserve,
			decimals: reserveDecimals,
		});

		if (config.deficitThreshold !== undefined) {
			const deficit = remoteAmount - reserveAmount;
			if (deficit > config.deficitThreshold) {
				return {
					matched: true,
					data: { type: "deficit", difference: deficit },
				};
			}
		}

		if (config.surplusThreshold !== undefined) {
			const surplus = reserveAmount - remoteAmount;
			if (surplus > config.surplusThreshold) {
				return {
					matched: true,
					data: { type: "surplus", difference: surplus },
				};
			}
		}

		return { matched: false };
	},

	alertTemplate: (
		event,
		{ config },
		data,
	): Alert<CrosschainInvariantPayload> => {
		const isDeficit = data.type === "deficit";
		const direction = isDeficit ? "Deficit" : "Surplus";
		const reserveAmount = toDecimal({
			amount: event.payload.reserve,
			decimals: event.payload.inputs.reserveDecimals,
		});
		const remoteAmount = toDecimal({
			amount: event.payload.remote,
			decimals: event.payload.inputs.remoteDecimals,
		});
		const reserveChain =
			NetworkMap.fromURN(event.payload.inputs.reserveChain) ?? 0;
		const remoteChain =
			NetworkMap.fromURN(event.payload.inputs.remoteChain) ?? 0;
		const symbol = event.payload.inputs.assetSymbol;

		const alert: Alert<CrosschainInvariantPayload> = {
			timestamp: Date.now(),
			level: config.level,
			name: ruleName,
			networks: [
				{
					network: reserveChain,
					role: "reserve",
				},
				{
					network: remoteChain,
					role: "remote",
				},
			],
			message: [
				["t", `${direction} detected Δ`],
				[
					"a",
					((isDeficit ? -1 : 1) * data.difference).toLocaleString(undefined, {
						maximumFractionDigits: 4,
					}),
				],
				["t", symbol],
			],
			remark: isDeficit
				? `Deficit > ${config.deficitThreshold?.toFixed(4)}`
				: `Surplus > ${config.surplusThreshold?.toFixed(4)}`,
			payload: {
				kind: "xc-invariant",
				reserve: {
					address: event.payload.inputs.reserveAddress,
					network: event.payload.inputs.reserveChain,
					balance: reserveAmount,
				},
				remote: {
					network: event.payload.inputs.remoteChain,
					balance: remoteAmount,
				},
				asset: {
					id: event.payload.inputs.reserveAssetId,
					symbol,
				},
			},
		};

		return alert;
	},
};
