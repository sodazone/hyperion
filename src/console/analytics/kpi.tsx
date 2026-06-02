export function Kpi({
	qty,
	title,
	delta,
	description,
}: {
	qty: string;
	title: string;
	delta?: {
		pct: number;
		period?: string;
	};
	description?: string;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-zinc-400 font-medium">{title}</span>

			<span className="text-lg font-bold text-zinc-100 font-mono tracking-tight">
				${qty}
			</span>

			{delta === undefined ? (
				<span className="text-zinc-500 text-xs">{description ?? ""}</span>
			) : (
				<div className="flex items-center gap-1 text-xs">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						role="img"
						aria-hidden="true"
						className={`transform transition-transform duration-200 ${
							delta.pct < 0 ? "rotate-180 text-pink-400" : "text-cyan-400"
						}`}
					>
						<path
							d="M13.3021 7.7547L17.6821 14.2475C18.4182 15.3388 17.7942 17 16.6482 17L7.3518 17C6.2058 17 5.5818 15.3376 6.3179 14.2475L10.6979 7.7547C11.377 6.7484 12.623 6.7484 13.3021 7.7547Z"
							fill="currentColor"
						/>
					</svg>
					<div className="flex gap-2">
						<span className="font-mono font-semibold">
							{Math.abs(delta.pct).toFixed(2)}%
						</span>
						<span className="text-zinc-500">{delta.period}</span>
					</div>
				</div>
			)}
		</div>
	);
}
