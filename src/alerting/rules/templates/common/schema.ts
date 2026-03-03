import z from "zod";
import { topLevelCategories } from "@/intel/mapping";

export const level = z
	.number()
	.min(1)
	.max(3)
	.default(1)
	.meta({
		label: "Severity",
		options: [
			{ label: "Info", value: 1 },
			{ label: "Warning", value: 2 },
			{ label: "Critical", value: 3 },
		],
		help: "Severity level of the flagged activity.",
	});

export const networks = z.array(z.string()).optional().meta({
	label: "Networks",
	input: "select-networks",
	multiple: true,
	help: "Applies to all networks by default. If specified, only selected networks will be monitored.",
});

export const categoriesMeta = {
	label: "Categories",
	options: [
		...topLevelCategories.map((c) => ({
			label: c.label,
			value: c.category.toString(),
		})),
	],
	multiple: true,
	help: "If a activity matches any of the selected categories.",
};

export const tagsMeta = {
	label: "Tags",
	input: "select-tags",
	multiple: true,
	help: "If a activity matches any of the selected tags.",
};

export const includePublicEntitiesMeta = {
	label: "Include Public Registry",
	help: "If public entities are included in the classification.",
};
