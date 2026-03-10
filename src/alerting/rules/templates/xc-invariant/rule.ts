import type { Alert, AlertPayload } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import { toDecimal } from "@/utils/amounts";
import type { IssuanceEvent, RuleDefinition } from "../../types";
import { type Config, schema, subscriptionIds } from "./schema";

const ruleName = "xc-invariant";
const SO_STATE_VAR = "so";

const defaults = {
	level: 1,
	kSlack: 0.002, // ~0.2%
	hThreshold: 0.02, // ~2% sustained drift
	minConsecutive: 3,
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
		difference: number;
		ratio: number;
		coveragePercent: number;
		reserveAmount: number;
		remoteAmount: number;
	},
	Config
> = {
	id: ruleName,
	title: "Crosschain Invariant",
	description:
		"Alerts when crosschain reserve and remote balances diverge beyond thresholds.",
	schema,
	defaults,
	autoDependencies: subscriptionIds.map((subscriptionId) => ({
		kind: "issuance",
		subscriptionId,
	})),

	matcher: async (event, { config, global: { state }, id }) => {
		if (
			event.type !== "issuance" ||
			event.payload.subscriptionId !== config.subscriptionId
		) {
			return { matched: false };
		}

		if (
			config.assetSymbols?.length &&
			!config.assetSymbols.includes(event.payload.inputs.assetSymbol)
		) {
			return { matched: false };
		}

		const reserveAmount = toDecimal({
			amount: event.payload.reserve,
			decimals: event.payload.inputs.reserveDecimals,
		});
		const remoteAmount = toDecimal({
			amount: event.payload.remote,
			decimals: event.payload.inputs.remoteDecimals,
		});

		const ns = `${ruleName}:${id}`;

		const stateObj = (state.get(ns, SO_STATE_VAR) ?? {
			consecutive: 0,
		}) as { consecutive: number };

		const ratio = remoteAmount / Math.max(reserveAmount, 1e-12);
		const deviation = Math.abs(Math.log(ratio));

		if (deviation > config.hThreshold) {
			stateObj.consecutive++;
		} else {
			stateObj.consecutive = 0;
		}

		state.set(ns, SO_STATE_VAR, stateObj);

		if (stateObj.consecutive >= (config.minConsecutive ?? 1)) {
			stateObj.consecutive = 0;
			state.set(ns, SO_STATE_VAR, stateObj);

			return {
				matched: true,
				data: {
					difference: remoteAmount - reserveAmount,
					reserveAmount,
					remoteAmount,
					ratio,
					coveragePercent:
						(reserveAmount / Math.max(remoteAmount, 1e-12)) * 100,
				},
			};
		}

		return { matched: false };
	},

	alertTemplate: (
		event,
		{ config },
		data,
	): Alert<CrosschainInvariantPayload> => {
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
				["t", "Deficit detected Δ"],
				[
					"a",
					data.difference.toLocaleString(undefined, {
						maximumFractionDigits: 4,
					}),
				],
				["t", symbol],
			],
			remark: `Remote/Reserve coverage ${data.coveragePercent.toFixed(2)}%`,
			payload: {
				kind: "xc-invariant",
				reserve: {
					address: event.payload.inputs.reserveAddress,
					network: event.payload.inputs.reserveChain,
					balance: data.reserveAmount,
				},
				remote: {
					network: event.payload.inputs.remoteChain,
					balance: data.remoteAmount,
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
