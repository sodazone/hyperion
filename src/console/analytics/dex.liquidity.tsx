import type { DexLiquidityRow } from "@/db/backend/duckdb/types";
import { render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { CopyButton } from "../components/btn.copy";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { monetaryDelta, protocolLabel } from "./format";
import { Kpi } from "./kpi";
import { PaginationControls } from "./pagination";
import { parseDashboardParamsForDefi } from "./params";

const ROWS_PER_PAGE = 5;

export function DexLiquidityCard({ row }: { row: DexLiquidityRow }) {
	const isPositive = row.tvl_change_usd >= 0;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				<div className="text-zinc-100 font-semibold">{row.label}</div>
				<div className="text-xs text-zinc-500">
					<span className="flex gap-1 items-center font-mono truncate">
						<span className="truncate">{truncMid(row.market_id)}</span>
						<CopyButton title="Copy Address" text={row.market_id} size={12} />
					</span>
				</div>
			</div>

			{/* Right */}
			<div className="flex flex-wrap sm:flex-nowrap gap-4 text-sm justify-end flex-1">
				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">TVL</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(row.supplied_usd, 2)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Δ</span>
					<span
						className={`font-mono ${isPositive ? "text-cyan-200" : "text-pink-300"}`}
					>
						{monetaryDelta(row.tvl_change_usd)}
					</span>
					<div className="text-zinc-500 text-xs">
						{protocolLabel(row.protocol)}
					</div>
				</div>
			</div>
		</div>
	);
}

export async function DexLiquidityFragment(
	ctx: PageContext,
	req: Bun.BunRequest<"/console/dashboard/fragments/dex-liquidity">,
) {
	const { network, bucket, lookback, periodLabel } =
		parseDashboardParamsForDefi(req);

	const rows = (await ctx.db.analytics.dexLiquiditySeries({
		network,
		bucket,
		lookback,
	})) as DexLiquidityRow[];

	if (!rows || rows.length === 0) {
		return render(
			<div className="px-4 py-6 text-sm text-zinc-500">
				No exchange data yet.
			</div>,
		);
	}

	const latestRow = rows[rows.length - 1];
	const earliestRow = rows[0];

	const currentTotalTvl = latestRow?.total_aggregate_tvl_usd ?? 0;
	const baselineTotalTvl = earliestRow?.total_aggregate_tvl_usd ?? 0;

	const periodDeltaUsd = currentTotalTvl - baselineTotalTvl;
	const periodDeltaPct =
		baselineTotalTvl > 0 ? (periodDeltaUsd / baselineTotalTvl) * 100 : 0;

	const uniquePoolsMap = new Map<string, DexLiquidityRow>();
	for (const row of rows) {
		const key = `${row.protocol}:${row.market_id}`;
		const existing = uniquePoolsMap.get(key);
		if (!existing || new Date(row.ts) > new Date(existing.ts)) {
			uniquePoolsMap.set(key, row);
		}
	}
	const lastRows = Array.from(uniquePoolsMap.values()).sort(
		(a, b) => b.supplied_usd - a.supplied_usd,
	);

	return render(
		<div className="space-y-6">
			<Kpi
				title="Total TVL"
				qty={`${formatNumberSI(currentTotalTvl, 2)}`}
				period={periodLabel}
				deltaPct={periodDeltaPct}
			/>
			<div
				x-data={`pagination({totalItems: ${lastRows.length}, perPage: ${ROWS_PER_PAGE}})`}
				className="space-y-4"
			>
				<div className="flex flex-col divide-y divide-zinc-900">
					{lastRows.map((r, index) => (
						<div
							key={`${r.protocol}-${r.market_id}-${index}`}
							x-show={`isVisible(${index + 1})`}
						>
							<DexLiquidityCard row={r} />
						</div>
					))}
				</div>
				<PaginationControls />
			</div>
		</div>,
	);
}
