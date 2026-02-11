import { ExclamationIcon } from "./icons";

const LEVEL_META: Record<
	number,
	{ label: string; className: string; icon?: React.ReactNode }
> = {
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
		className: "bg-pink-900/70 text-red-300",
		icon: <ExclamationIcon size={16} />,
	},
};

export function SeverityBadge({ level }: { level: number }) {
	const meta = LEVEL_META[level] ?? LEVEL_META[1];

	return (
		<span
			className={`inline-flex gap-1 items-center text-xs font-semibold px-2 py-1 rounded-full ${meta?.className}`}
		>
			{meta?.icon}
			{meta?.label ?? level}
		</span>
	);
}
