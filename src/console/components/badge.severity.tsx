import { ExclamationIcon } from "./icons";

const LEVEL_META: Record<
	number,
	{ label: string; className: string; icon?: React.ReactNode }
> = {
	1: {
		label: "Info",
		className: "bg-zinc-900 text-zinc-300",
	},
	2: {
		label: "Warning",
		className: "bg-amber-950 text-amber-400",
	},
	3: {
		label: "Critical",
		className: "bg-rose-950 text-rose-300",
		icon: <ExclamationIcon size={16} />,
	},
};

export function SeverityBadge({ level }: { level: number }) {
	const meta = LEVEL_META[level] ?? LEVEL_META[1];

	return (
		<span
			className={`inline-flex gap-1 items-center text-xs font-semibold px-1 py-0.5 rounded-md ${meta?.className}`}
		>
			{meta?.icon}
			{meta?.label ?? level}
		</span>
	);
}
