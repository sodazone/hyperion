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
		neutral: "bg-zinc-900 text-zinc-300 border-zinc-800",
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
