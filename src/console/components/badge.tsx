export function SplitBadge({
	left,
	right,
	tone = "neutral",
}: {
	left: string;
	right: string;
	tone?: "neutral" | "info" | "warn";
}) {
	const tones = {
		neutral: "bg-zinc-900 text-zinc-200 border-zinc-800",
		info: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
		warn: "bg-red-500/10 text-red-300 border-red-500/20",
	};

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${tones[tone]}`}
		>
			<span className="opacity-80">{left}</span>
			<span className="mx-1 h-3 w-px bg-current opacity-30" />
			<span className="font-medium">{right}</span>
		</span>
	);
}

export function TagBadge({ tag }: { tag: string }) {
	const [key, value] = tag.split(":");

	return (
		<span
			className="inline-flex truncate items-center rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-200 max-w-xs"
			title={tag}
		>
			{value != null ? (
				<>
					<span className="opacity-80 truncate">{key}</span>
					<span className="mx-1 h-3 w-px bg-current opacity-30" />
					<span className="truncate">{value}</span>
				</>
			) : (
				<span className="truncate">{key}</span>
			)}
		</span>
	);
}
