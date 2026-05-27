import type { MoneyMarketHealthRow } from "@/db/backend/duckdb/types";
import { render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { dateFormatter } from "@/utils/dates";
import { CopyButton } from "../components/btn.copy";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { PaginationControls } from "./pagination";
import { parseDashboardParams } from "./params";

const ROWS_PER_PAGE = 5;

function formatPct(n: number | null) {
	if (n === null || n === undefined) return "—";
	return `${(n * 100).toFixed(1)}%`;
}

export function MoneyMarketHealthCard({ row }: { row: MoneyMarketHealthRow }) {
	const hasBadDebt = row.bad_debt_usd > 0;
	const isSolvent = row.solvency_ratio === null || row.solvency_ratio >= 1.0;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left: Protocol, Label & Copyable Address Identifier */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				<span className="text-xs text-zinc-500 tracking-wide font-mono">
					{dateFormatter.format(new Date(row.ts))}
				</span>
				<div className="flex items-center gap-2">
					<div className="text-zinc-100 font-semibold">{row.label}</div>
					{row.is_paused && (
						<span className="px-1 py-0.5 text-[10px] bg-red-950 text-red-400 font-bold rounded uppercase">
							Paused
						</span>
					)}
				</div>
				<div className="text-xs text-zinc-500">
					<span className="flex gap-1 items-center font-mono truncate">
						<span className="truncate">{truncMid(row.market_id)}</span>
						<CopyButton title="Copy Address" text={row.market_id} size={12} />
					</span>
				</div>
			</div>

			{/* Right: Structural Risk Variables & Trimmed Sub-Protocol Indicators */}
			<div className="flex flex-wrap sm:flex-nowrap gap-4 text-sm justify-end flex-1">
				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Supplied</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(row.supplied_usd, 2)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Utilization</span>
					<span className="text-zinc-100 font-mono">
						{formatPct(row.utilization)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Solvency</span>
					<span
						className={`font-mono ${isSolvent ? "text-cyan-200" : "text-pink-300 font-bold"}`}
					>
						{row.solvency_ratio ? row.solvency_ratio.toFixed(2) : "—"}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Bad Debt</span>
					<span
						className={`font-mono ${hasBadDebt ? "text-pink-300 font-bold" : "text-zinc-500"}`}
					>
						${formatNumberSI(row.bad_debt_usd, 2)}
					</span>
					<div className="text-zinc-500 text-xs">
						{row.protocol.indexOf(".") > -1
							? row.protocol.split(".")[1]
							: row.protocol}
					</div>
				</div>
			</div>
		</div>
	);
}

export async function MoneyMarketHealthFragment(
	ctx: PageContext,
	req: Bun.BunRequest<"/console/dashboard/fragments/mm-health">,
) {
	const { network: _network } = parseDashboardParams(req);

	let network = _network ?? "urn:ocn:polkadot:1000";
	if (network === "urn:ocn:polkadot:2004") {
		network = "urn:ocn:ethereum:1284";
	}

	const rows = (await ctx.db.analytics.moneyMarketHealthSeries({
		network,
		bucket: "hour",
		lookback: 24,
	})) as MoneyMarketHealthRow[];

	if (!rows || rows.length === 0) {
		return render(
			<div className="px-4 py-6 text-sm text-zinc-500">
				No lending health data yet.
			</div>,
		);
	}

	return render(
		<div
			x-data={`pagination({totalItems: ${rows.length}, perPage: ${ROWS_PER_PAGE}})`}
			className="space-y-4"
		>
			<div className="flex flex-col divide-y divide-zinc-900">
				{rows.map((r, index) => (
					<div
						key={`${r.protocol}-${r.market_id}-${index}`}
						x-show={`isVisible(${index + 1})`}
					>
						<MoneyMarketHealthCard row={r} />
					</div>
				))}
			</div>
			<PaginationControls />
		</div>,
	);
}
