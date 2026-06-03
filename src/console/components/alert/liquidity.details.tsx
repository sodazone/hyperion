import { truncMid } from "@/console/util";
import { CopyButton } from "../btn.copy";

function DetailRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-2 text-sm min-h-6">
			<span className="text-zinc-500 w-20 shrink-0 capitalize">{label}</span>
			<div className="flex items-center gap-1.5 text-zinc-300 min-w-0 flex-1">
				{children}
			</div>
		</div>
	);
}

function ReasonBadge({ reason }: { reason: string }) {
	const isCritical = reason === "insolvency";
	return (
		<span
			className={`px-1.5 py-0.5 text-xs font-mono font-medium rounded ${
				isCritical
					? "bg-red-950/40 text-red-300"
					: "bg-amber-950/40 text-amber-300"
			}`}
		>
			{reason}
		</span>
	);
}

export function MoneyMarketDetails({ payload }: { payload: any }) {
	return (
		<div className="flex flex-col gap-2 px-3 py-1.5 rounded-md bg-zinc-800/20 w-full">
			<DetailRow label="Protocol">
				<span className="text-zinc-100 font-medium">{payload.protocol}</span>
			</DetailRow>

			<DetailRow label="Market ID">
				<span className="font-mono text-xs text-zinc-400 truncate">
					{truncMid(payload.marketId)}
				</span>
				<CopyButton title="Copy Market Address" text={payload.marketId} />
			</DetailRow>

			<DetailRow label="Reason">
				<ReasonBadge reason={payload.reason} />
			</DetailRow>

			{payload.details && (
				<div className="mt-1.5 pt-2 text-xs">
					<div className="text-zinc-500 mb-1 font-medium">
						Condition Details
					</div>
					<p className="font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
						{payload.details}
					</p>
				</div>
			)}
		</div>
	);
}

export function DexDetails({ payload }: { payload: any }) {
	return (
		<div className="flex flex-col gap-2 px-3 py-1.5 rounded-md bg-zinc-800/20 w-full">
			<DetailRow label="Protocol">
				<span className="text-zinc-100 font-medium">{payload.protocol}</span>
			</DetailRow>

			<DetailRow label="Pool">
				<span className="font-mono text-xs text-zinc-400 truncate">
					{truncMid(payload.marketId)}
				</span>
				<CopyButton title="Copy Pool Address" text={payload.marketId} />
			</DetailRow>
		</div>
	);
}
