import type { Alert, AlertMessagePart, AlertPayload } from "@/db";
import { capFirst } from "@/utils/strings";
import type {
	OpenGovEvent,
	OpenGovEventType,
	RuleDefinition,
} from "../../types";
import { makeNetworks } from "../common/helpers";
import { type Config, schema } from "./schema";

const ruleName = "opengov";

export interface OpenGovAlertPayload extends AlertPayload {
	kind: "opengov";
	link?: string;
	willExecuteAt?: string;
}

const defaults = {
	level: 1,
	networks: [] as string[],
	eventTypes: [] as OpenGovEventType[],
};

export const OpenGovRule: RuleDefinition<OpenGovEvent, void, Config> = {
	id: ruleName,
	autoDependencies: [{ kind: "opengov" }],
	title: "OpenGov Alerts",
	description: "Alerts on OpenGov events filtered by network and event type.",
	schema,
	defaults,

	matcher: async (event, { config }) => {
		if (
			config.networks?.length &&
			!config.networks.includes(event.origin.chainURN) &&
			!(
				event.destination &&
				config.networks.includes(event.destination.chainURN)
			)
		) {
			return { matched: false };
		}

		if (
			config.eventTypes?.length &&
			!config.eventTypes.includes(event.payload.eventType)
		) {
			return { matched: false };
		}

		return { matched: true };
	},

	alertTemplate: (event, { config }): Alert<OpenGovAlertPayload> => {
		const { payload } = event;

		const title = payload.content?.title?.trim() || "Untitled proposal";

		const status =
			payload.humanized?.status ??
			capFirst(payload.eventType.replaceAll("_", " "));

		const track =
			payload.info?.origin?.value?.type ??
			payload.info?.origin?.type ??
			"Unknown";

		const message: AlertMessagePart[] = [
			["t", `OpenGov #${payload.id}`],
			["e", track],
			["t", status],
			["t", " — "],
			["t", title],
		];

		return {
			timestamp: Date.now(),
			level: config.level,
			name: ruleName,
			networks: makeNetworks(event),
			message,
			payload: {
				kind: "opengov",
				link: payload.content.link,
				willExecuteAt: payload.timeline?.willExecuteAtUtc,
			},
		};
	},
};
