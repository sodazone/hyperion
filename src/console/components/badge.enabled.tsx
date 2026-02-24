export function EnabledBadge({ enabled }: { enabled?: boolean }) {
	return (
		<span
			className={`
				px-2 py-0.5 rounded-full text-[10px] font-medium
				${enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700/40 text-zinc-400"}
			`}
		>
			{enabled ? "Enabled" : "Disabled"}
		</span>
	);
}
