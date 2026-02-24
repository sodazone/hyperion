export function EnabledBadge({ enabled }: { enabled?: boolean }) {
	return (
		<span
			className={`
				px-1 py-px rounded-full text-[10px] font-medium
				${enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700/40 text-zinc-400"}
			`}
		>
			{enabled ? "Enabled" : "Disabled"}
		</span>
	);
}
