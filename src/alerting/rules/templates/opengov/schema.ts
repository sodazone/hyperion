import z from "zod";
import { OpenGovEventTypes } from "../../types";
import { level } from "../common/schema";
import { humanizeStatus } from "./support/helpers";

export const eventTypesMeta = {
	label: "Event Types",
	options: [
		...OpenGovEventTypes.map((c) => ({
			label: humanizeStatus(c),
			value: c,
		})),
	],
	multiple: true,
	help: "Filter which OpenGov event types trigger alerts.",
};

export const supportedNetworks = {
	label: "Networks",
	options: [
		{
			label: "Bifrost",
			value: "urn:ocn:polkadot:2030",
		},
		{
			label: "Hydration",
			value: "urn:ocn:polkadot:2034",
		},
		{
			label: "Moonbeam",
			value: "urn:ocn:polkadot:2004",
		},
		{
			label: "Polkadot",
			value: "urn:ocn:polkadot:1000",
		},
		{
			label: "Kusama",
			value: "urn:ocn:kusama:1000",
		},
	],
	multiple: true,
	help: "Applies to all networks by default. If specified, only selected networks will be monitored.",
};

export const schema = z.object({
	level,
	eventTypes: z.array(z.enum(OpenGovEventTypes)).meta(eventTypesMeta),
	networks: z.array(z.string()).optional().meta(supportedNetworks),
});

export type Config = z.infer<typeof schema>;
