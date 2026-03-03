import type { Alert, AlertPayload } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import { toDecimal } from "@/utils/amounts";
import type { IssuanceEvent, RuleDefinition } from "../../types";
import { type Config, schema } from "./schema";

const ruleName = "xc-invariant";
const SO_STATE_VAR = "so";

const defaults = {
	level: 1,
	kSlack: 50,
	minConsecutive: 1,
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

	resolveDependencies: (instance) => {
		return [
			{
				kind: "issuance",
				subscriptionId: instance.config.subscriptionId,
			},
		];
	},

	matcher: async (event, { config, global: { state }, id }) => {
		if (
			event.type !== "issuance" ||
			event.payload.subscriptionId !== config.subscriptionId
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

		const maxStep = config.maxStep ?? Infinity;
		const ns = `${ruleName}:${id}`;
		const so = (state.get(ns, SO_STATE_VAR) ?? {
			sMinus: 0,
			consecutiveDeficit: 0,
		}) as {
			sMinus: number;
			consecutiveDeficit: number;
		};

		const rawDiff = reserveAmount - remoteAmount;

		if (rawDiff < 0) {
			so.consecutiveDeficit++;
		} else {
			so.consecutiveDeficit = 0;
			so.sMinus = 0;
		}

		if (so.consecutiveDeficit >= (config.minConsecutive ?? 1)) {
			const step = Math.max(rawDiff, -maxStep);
			so.sMinus += step + config.kSlack;
			if (so.sMinus > 0) so.sMinus = 0;
		}

		state.set(ns, SO_STATE_VAR, so);

		if (so.sMinus < -config.hThreshold) {
			so.sMinus = 0;
			so.consecutiveDeficit = 0;

			state.set(ns, SO_STATE_VAR, so);

			return {
				matched: true,
				data: {
					difference: remoteAmount - reserveAmount,
					reserveAmount,
					remoteAmount,
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
			remark: `Deficit > ${config.hThreshold?.toFixed(4)}`,
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
