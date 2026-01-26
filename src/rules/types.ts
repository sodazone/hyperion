export interface BaseEvent<T extends string = string, P = unknown> {
	type: T;
	chain: string;
	blockHeight: string;
	txHash?: string;
	timestamp?: number;

	payload: P;

	addresses?: string[];
	assets?: string[];
}

export type TransferPayload = {
	from: string;
	to: string;
	amount: bigint;
	usdAmount: number;
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
	now: () => number;
}

export type AnyEvent = EventMap[keyof EventMap];

type RuleMatcher<Event extends BaseEvent = AnyEvent> = (
	event: Event,
	ctx: RuleContext,
) => Promise<boolean> | boolean;

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
			kind: "custom";
			stream: string;
			filter: unknown;
	  };

export type Rule<Event extends BaseEvent = AnyEvent> = {
	id: string;
	bundle?: string;
	priority?: number;
	matcher: RuleMatcher;
	dependencies?: RuleDependency[];
	alertTemplate?: (event: Event, ctx: RuleContext) => Promise<Alert> | Alert;
	cooldownMs?: number;
};

export type Alert = {
	ruleId: string;
	level: number;
	message: string;
};
