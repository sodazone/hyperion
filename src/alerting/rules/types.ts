import type z from "zod";
import type { Alert, HyperionDB } from "@/db";
import type { OpenGovPayload } from "./templates/opengov/support/types";

export type Segment = {
	chainURN: string;
	blockHeight?: string;
	blockHash?: string;
	txHash?: string;
	timestamp?: number;
	protocol?: string;
};

export interface BaseEvent<T extends string = string, P = unknown> {
	type: T;
	origin: Segment;
	destination?: Segment;

	payload: P;

	addresses?: string[];
	assets?: string[];
}

export enum TransferStatus {
	SUCCESS = 0,
	FAILURE = 1,
}

export type AssetAmount = {
	id: string;
	symbol: string;
	decimals: number;
	amount: string;
	amountUsd: number;
};

export type TransferSegment = {
	address: string;
	addressFormatted?: string;
	categories?: number[];
	tags?: string[];
};

export type TransferPayload = {
	correlationId: string;
	status: TransferStatus;
	from: TransferSegment;
	to: TransferSegment;
	assets: AssetAmount[];
	totalUsd: number;
};

export type TransferEvent = BaseEvent<"transfer", TransferPayload>;

export type OpenGovEventPayload = {
	id: number;
	chainId: string;
	eventType: OpenGovEventType;
	humanized: {
		status: string;
	};
	triggeredBy: OpenGovPayload["triggeredBy"];
	info: OpenGovPayload["info"];
	decodedCall: OpenGovPayload["decodedCall"];
	content: OpenGovPayload["content"];
	timeline?: {
		willExecuteAtUtc?: string;
	};
};

export const OpenGovEventTypes = [
	"deciding",
	"approved",
	"rejected",
	"execution_failed",
] as const;

export type OpenGovEventType = (typeof OpenGovEventTypes)[number];
export type OpenGovEvent = BaseEvent<"opengov", OpenGovEventPayload>;

export type IssuanceEvent = BaseEvent<
	"issuance",
	{
		subscriptionId: string;
		protocol: string;
		inputs: {
			reserveChain: string;
			reserveAssetId: string;
			reserveAddress: string;
			reserveDecimals: number;

			remoteChain: string;
			remoteAssetId: string;
			remoteDecimals: number;

			assetSymbol: string;
		};
		reserve: string;
		remote: string;
	}
>;

export interface EventMap {
	transfer: TransferEvent;
	issuance: IssuanceEvent;
	opengov: OpenGovEvent;
}

export type StateValue = unknown;

export interface StateStore {
	get(scope: string, key: string): StateValue | undefined;
	set(scope: string, key: string, value: StateValue): void;
	delete(scope: string, key: string): void;
	load(): Promise<void>;
	stop(): Promise<void>;
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
	id: number;
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
			kind: "issuance";
			subscriptionId: string;
	  }
	| {
			kind: "opengov";
	  }
	| {
			kind: "transfer";
	  }
	| { kind: "xc" };

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
	defaults: Partial<Config>;
	matcher: RuleMatcher<Event, Data, Config>;
	autoDependencies?: RuleDependency[];
	resolveDependencies?: (instance: RuleInstance) => RuleDependency[];
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

export type RuleChannel = {
	id: number;
	owner: Uint8Array | string;
	name: string;
	type: string;
	enabled: boolean;
	config: Record<string, any>;
};

export type RuleInstance = {
	id: number;
	title: string;
	owner: Uint8Array;
	ruleKey: string;
	enabled: boolean;
	config: any;
	channels: RuleChannel[];
	cooldownMs?: number;
	priority?: number;
};

export type FieldMeta = {
	label?: string;
	help?: string;
	suffix?: string;
	placeholder?: string;
	decimals?: boolean;
	input?:
		| "text"
		| "number"
		| "select"
		| "checkbox"
		| "select-networks"
		| "select-tags";
	options?: { label: string; value: string | number }[];
	multiple?: boolean;
};
