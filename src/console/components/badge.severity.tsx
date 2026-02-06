const LEVEL_META: Record<number, { label: string; className: string }> = {
	1: {
		label: "Info",
		className: "bg-zinc-800 text-zinc-300",
	},
	2: {
		label: "Warning",
		className: "bg-amber-900/70 text-amber-300",
	},
	3: {
		label: "Critical",
		className: "bg-red-900/80 text-red-200",
	},
};

export function SeverityBadge({ level }: { level: number }) {
	const meta = LEVEL_META[level] ?? LEVEL_META[1];

	return (
		<span
			className={`text-xs font-semibold px-2 py-1 rounded-full ${meta?.className}`}
		>
			{meta?.label ?? level}
		</span>
	);
}
