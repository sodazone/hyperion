import type { DexLiquidityRow } from "@/db/backend/duckdb/types";
import { empty, render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { CopyButton } from "../components/btn.copy";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { monetaryDelta, protocolLabel } from "./format";
import { Kpi } from "./kpi";
import { PaginationControls } from "./pagination";
import { parseDashboardParamsForDefi } from "./params";

const ROWS_PER_PAGE = 5;

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
					<span className="text-zinc-500 text-xs">TVL ({period})</span>
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

	// 1. Fetch TVL series data
	const rows = await ctx.db.analytics.dexLiquiditySeries({
		network,
		bucket,
		lookback,
	});

	// 2. Fetch volume series data
	const volumeRows = await ctx.db.analytics.defiVolumeSeries({
		network,
		bucket,
		lookback,
		type: "dex",
	});

	if (!rows || rows.length === 0) {
		return empty;
	}

	// 3. Aggregate volumes over the lookback window & track volumes per timestamp
	const poolVolumeMap = new Map<string, number>();
	const volumeByTimestampMap = new Map<string, number>();
	let totalAggregateVolumeUsd = 0;

	if (volumeRows && volumeRows.length > 0) {
		for (const volRow of volumeRows) {
			const key = `${volRow.protocol}:${volRow.market_id}`;
			const volAmount = Number(volRow.swap_volume_usd ?? 0);

			// Map absolute totals per pool for the cards
			poolVolumeMap.set(key, (poolVolumeMap.get(key) || 0) + volAmount);
			totalAggregateVolumeUsd += volAmount;

			// Map totals per timestamp chunk to figure out lookback delta
			const tsKey = String(volRow.ts);
			volumeByTimestampMap.set(
				tsKey,
				(volumeByTimestampMap.get(tsKey) || 0) + volAmount,
			);
		}
	}

	// 4. Calculate TVL Deltas
	const latestRow = rows[rows.length - 1];
	const earliestRow = rows[0];

	const currentTotalTvl = latestRow?.total_aggregate_tvl_usd ?? 0;
	const baselineTotalTvl = earliestRow?.total_aggregate_tvl_usd ?? 0;

	const periodDeltaUsd = currentTotalTvl - baselineTotalTvl;
	const periodDeltaPct =
		baselineTotalTvl > 0 ? (periodDeltaUsd / baselineTotalTvl) * 100 : 0;

	// 5. Calculate Volume Deltas (Latest time-bucket volume vs Earliest time-bucket volume)
	const sortedVolumeTimestamps = Array.from(volumeByTimestampMap.keys()).sort(
		(a, b) => new Date(a).getTime() - new Date(b).getTime(),
	);

	const earliestVolumeTs = sortedVolumeTimestamps[0] ?? "";
	const latestVolumeTs =
		sortedVolumeTimestamps[sortedVolumeTimestamps.length - 1] ?? "";

	const currentBucketVolume = volumeByTimestampMap.get(latestVolumeTs) || 0;
	const baselineBucketVolume = volumeByTimestampMap.get(earliestVolumeTs) || 0;

	const volumeDeltaUsd = currentBucketVolume - baselineBucketVolume;
	const volumeDeltaPct =
		baselineBucketVolume > 0
			? (volumeDeltaUsd / baselineBucketVolume) * 100
			: 0;

	// 6. Deduplicate pool records to get latest TVL snapshot state
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
				{/* KPI Panel Row */}
				<div className="px-2 flex flex-wrap gap-8 md:gap-12">
					<Kpi
						title="Total TVL"
						qty={`${formatNumberSI(currentTotalTvl, 2)}`}
						delta={{ period: periodLabel, pct: periodDeltaPct }}
					/>
					<Kpi
						title="Trading Volume"
						qty={`${formatNumberSI(totalAggregateVolumeUsd, 2)}`}
						delta={{ period: periodLabel, pct: volumeDeltaPct }}
					/>
				</div>

				<div
					x-data={`pagination({totalItems: ${lastRows.length}, perPage: ${ROWS_PER_PAGE}})`}
					className="space-y-4"
				>
					<div className="flex flex-col divide-y divide-zinc-900">
						{lastRows.map((r, index) => {
							const poolKey = `${r.protocol}:${r.market_id}`;
							const totalPoolVolume = poolVolumeMap.get(poolKey) || 0;

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
