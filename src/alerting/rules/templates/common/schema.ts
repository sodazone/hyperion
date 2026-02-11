import z from "zod";

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
	help: "By default applies to all networks. If specified, only transfers on the selected networks will be monitored.",
});
