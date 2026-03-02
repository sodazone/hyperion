import z from "zod";
import { level } from "../common/schema";

const IssuanceSubscriptions = [
	{ id: "hyperion:assethub-DOT-hydration", name: "", description: "" },
	{ id: "hyperion:assethub-tBTC-hydration", name: "", description: "" },
] as const;

const subscriptionIds = IssuanceSubscriptions.map(
	(s) => s.id,
) as readonly string[];

export const schema = z.object({
	level,
	subscriptionId: z.enum(subscriptionIds).meta({
		label: "Subscription",
		help: "Ocelloids data source.",
	}),
	deficitThreshold: z.number().min(0).optional().meta({
		label: "Deficit Threshold",
		help: "Threshold for deficit between remote and reserve.",
	}),
	surplusThreshold: z.number().min(0).optional().meta({
		label: "Surplus Threshold",
		help: "Threshold for surplus between remote and reserve.",
	}),
});

export type Config = z.infer<typeof schema>;
