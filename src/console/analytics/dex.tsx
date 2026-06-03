import type { DexLiquidityRow } from "@/db/backend/duckdb/types";
import { empty, render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { CopyButton } from "../components/btn.copy";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { monetaryDelta, protocolLabel } from "./format";
import { calculateKpis, Kpi } from "./kpi";
import { PaginationControls } from "./pagination";
import { parseDashboardParamsForDefi } from "./params";

const ROWS_PER_PAGE = 5;
const EMPTY_KPI = { total: 0, deltaPct: 0 };

export function DexLiquidityCard({
	row,
	dataPoints,
	period,
	volumeUsd,
}: {
	row: DexLiquidityRow;
	dataPoints: number[];
	period: string;
	volumeUsd: number;
}) {
	const isPositive = row.tvl_change_usd >= 0;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				<div className="text-zinc-100 font-semibold text-sm">{row.label}</div>
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
					<span className="text-zinc-500 text-xs">Volume</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(volumeUsd, 2)}
					</span>
				</div>

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

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">TVL {period}</span>
					<div className="flex items-center justify-center pl-2 pt-1.5">
						<div
							x-data="sparkline"
							data-type="area"
							data-gap="2"
							data-opacity="0.5"
							data-colors="#aba4a6"
							data-min-length="10"
							data-points={dataPoints.join(",")}
						></div>
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

	const rows = await ctx.db.analytics.dexLiquiditySeries({
		network,
		bucket,
		lookback,
	});
	const volumeRows = await ctx.db.analytics.defiVolume({
		network,
		bucket,
		lookback,
		type: "dex",
	});

	if (!rows || rows.length === 0) {
		return empty;
	}

	const liquidityMetrics = calculateKpis(
		rows,
		[{ key: "total_aggregate_tvl_usd", mode: "state" }],
		{ dateKey: "ts" },
	);

	const { total_aggregate_tvl_usd: tvlKpi = EMPTY_KPI } = liquidityMetrics;

	const poolVolumeMap = new Map<string, number>();
	let currentTotalVolume = 0;
	let previousTotalVolume = 0;
	if (volumeRows) {
		for (const volRow of volumeRows) {
			const key = `${volRow.protocol}:${volRow.market_id}`;
			const volAmount = Number(volRow.current_swap_volume_usd ?? 0);
			poolVolumeMap.set(key, volAmount);
			currentTotalVolume += volAmount;
			previousTotalVolume += Number(volRow.previous_swap_volume_usd ?? 0);
		}
	}

	const volumeKpi = {
		total: currentTotalVolume,
		deltaPct:
			previousTotalVolume > 0
				? ((currentTotalVolume - previousTotalVolume) / previousTotalVolume) *
					100
				: 0,
	};

	// Deduplicate pool records
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
		<div className="flex flex-col p-4 space-y-4">
			<h3 className="text-zinc-200 text-sm font-semibold">Liquidity Pools</h3>
			<div className="space-y-6">
				{/* KPIs */}
				<div className="px-2 flex flex-wrap gap-8 md:gap-12">
					<Kpi
						title="Total TVL"
						qty={`$${formatNumberSI(tvlKpi.total, 2)}`}
						delta={{ period: periodLabel, pct: tvlKpi.deltaPct }}
					/>
					<Kpi
						title="Trading Volume"
						qty={`$${formatNumberSI(volumeKpi.total, 2)}`}
						delta={{ period: periodLabel, pct: volumeKpi.deltaPct }}
					/>
				</div>

				{/* Markets */}
				<div
					x-data={`pagination({totalItems: ${lastRows.length}, perPage: ${ROWS_PER_PAGE}})`}
					className="space-y-4"
				>
					<div className="flex flex-col divide-y divide-zinc-900">
						{lastRows.map((r, index) => {
							const poolKey = `${r.protocol}:${r.market_id}`;
							const totalPoolVolume = poolVolumeMap.get(poolKey) || 0;

							// Filter history items for the sparkline
							const poolHistory = rows
								.filter(
									(item) =>
										item.protocol === r.protocol &&
										item.market_id === r.market_id,
								)
								.sort(
									(a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
								)
								.map((item) => item.supplied_usd);

							return (
								<div
									key={`${r.protocol}-${r.market_id}-${index}`}
									x-show={`isVisible(${index + 1})`}
								>
									<DexLiquidityCard
										row={r}
										dataPoints={poolHistory}
										period={periodLabel}
										volumeUsd={totalPoolVolume}
									/>
								</div>
							);
						})}
					</div>
					<PaginationControls />
				</div>
			</div>
		</div>,
	);
}
