import type z from "zod";
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

export interface GlobalRuleContext {
	state: StateStore;
	db: HyperionDB;
	now: () => number;
}

export interface RuleContext<Config> {
	global: GlobalRuleContext;
	config: Config;
	owner: Uint8Array;
}

export type AnyEvent = EventMap[keyof EventMap];

export type MatchResult<T> = {
	matched: boolean;
	data?: T;
};

export type RuleMatcher<
	Event extends BaseEvent = AnyEvent,
	Result = unknown,
	Config = unknown,
> = (
	event: Event,
	ctx: RuleContext<Config>,
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

export type RuleDefinition<
	Event extends BaseEvent = AnyEvent,
	Data = unknown,
	Config = unknown,
> = {
	id: string;
	bundle?: string;
	priority?: number;
	description?: string;
	title?: string;
	schema: z.ZodObject;
	defaults: Config;
	matcher: RuleMatcher<Event, Data, Config>;
	dependencies?: RuleDependency[];
	alertTemplate?: (
		event: Event,
		ctx: RuleContext<Config>,
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

export type RuleInstance = {
	id: string;
	title: string;
	owner: Uint8Array;
	ruleKey: string;
	enabled: boolean;
	config: any;
	cooldownMs?: number;
	priority?: number;
};

export type FieldMeta = {
	label?: string;
	help?: string;
	suffix?: string;
	placeholder?: string;
	input?: "text" | "number" | "select" | "checkbox" | "select-networks";
	options?: { label: string; value: string | number }[];
	multiple?: boolean;
};
