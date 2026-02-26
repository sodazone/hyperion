import { resolveExchange } from "@/console/analytics/cex.names";
import { truncMid } from "@/console/util";
import type { AlertMessagePart } from "@/db";

function Part({ part: [type, value] }: { part: AlertMessagePart }) {
	switch (type) {
		case "t":
			return <span>{value}</span>;
		case "a":
			return (
				<span className="truncate font-mono font-semibold leading-none align-baseline">
					{value}
				</span>
			);
		case "addr":
			return (
				<span className="truncate font-mono font-semibold leading-none align-baseline">
					{truncMid(value)}
				</span>
			);
		case "cex": {
			const { icon, name } = resolveExchange(value);
			return (
				<span className="inline-flex items-baseline gap-1">
					{icon && (
						<img
							src={icon}
							alt={name}
							className="w-3 h-3 rounded-full align-baseline"
						/>
					)}
					<span className="truncate font-semibold">{name}</span>
				</span>
			);
		}
		case "e":
			return <span className="truncate font-semibold capitalize">{value}</span>;
		default:
			return <span className="text-zinc-400">{value}</span>;
	}
}

export function AlertMessage({ parts }: { parts: AlertMessagePart[] }) {
	if (parts === undefined || parts.length === 0) {
		return null;
	}
	return (
		<div className="flex flex-wrap items-baseline gap-1 text-zinc-200">
			{parts.map((p) => (
				<Part key={p[0] + p[1]} part={p} />
			))}
		</div>
	);
}
