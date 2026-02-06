import type { Alert, HyperionDB } from "@/db";

export interface BaseEvent<T extends string = string, P = unknown> {
	type: T;
	chain: string;
	blockHeight: string;
	blockHash: string;
	txHash?: string;
	timestamp?: number;

	payload: P;

	addresses?: string[];
	assets?: string[];
}

export type TransferPayload = {
	from: string;
	to: string;
	fromFormatted: string;
	toFormatted: string;
	amount: bigint;
	amountUsd: number;
	asset: {
		id: string;
		symbol: string;
		decimals: number;
	};
};

export type TransferEvent = BaseEvent<"transfer", TransferPayload>;

export type SwapEvent = BaseEvent<
	"swap",
	{
		trader: string;
		poolId: string;
		inAsset: string;
		outAsset: string;
		inAmount: bigint;
		outAmount: bigint;
	}
>;

export type MetricUpdateEvent = BaseEvent<
	"metric_update",
	{
		metricKey: string;
		value: bigint;
	}
>;

export interface EventMap {
	transfer: TransferEvent;
	swap: SwapEvent;
	metric: MetricUpdateEvent;
}

export type StateValue = unknown;

export interface StateStore {
	get(scope: string, key: string): StateValue | undefined;
	set(scope: string, key: string, value: StateValue): void;
	delete(scope: string, key: string): void;
}

export interface RuleContext {
	state: StateStore;
	db: HyperionDB;
	now: () => number;
}

export type AnyEvent = EventMap[keyof EventMap];

export type MatchResult<T> = {
	matched: boolean;
	data?: T;
};

export type RuleMatcher<
	Event extends BaseEvent = AnyEvent,
	Result = unknown,
> = (
	event: Event,
	ctx: RuleContext,
) => Promise<MatchResult<Result>> | MatchResult<Result>;

export type RuleDependency =
	| {
			kind: "storage";
			chain: string;
			key: string;
	  }
	| {
			kind: "balance";
			chain: string;
			address: string;
			asset: string;
	  }
	| {
			kind: "transfer";
	  }
	| {
			kind: "custom";
			stream: string;
			filter: unknown;
	  };

export type Rule<Event extends BaseEvent = AnyEvent, Data = unknown> = {
	id: string;
	owner: Uint8Array;
	bundle?: string;
	priority?: number;
	matcher: RuleMatcher<Event, Data>;
	dependencies?: RuleDependency[];
	alertTemplate?: (
		event: Event,
		ctx: RuleContext,
		matched: Data,
	) => Promise<Alert> | Alert;
	cooldownMs?: number;
};

export enum AlertLevel {
	Info = 1,
	Warning = 2,
	Critical = 3,
}

export const AlertLevelLabel: Record<AlertLevel, string> = {
	[AlertLevel.Info]: "info",
	[AlertLevel.Warning]: "warning",
	[AlertLevel.Critical]: "critical",
};
