import type { MoneyMarketHealthRow } from "@/db/backend/duckdb/types";
import { empty, render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { CopyButton } from "../components/btn.copy";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { formatPct, protocolLabel } from "./format";
import { Kpi } from "./kpi";
import { PaginationControls } from "./pagination";
import { parseDashboardParamsForDefi } from "./params";

const ROWS_PER_PAGE = 5;

export function MoneyMarketHealthCard({ row }: { row: MoneyMarketHealthRow }) {
	const isSolvent = row.solvency_ratio === null || row.solvency_ratio >= 0.99;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				<div className="flex items-center gap-2">
					<div className="text-zinc-100 font-semibold text-sm">{row.label}</div>
					{row.is_paused && (
						<span className="px-1 py-0.5 text-[10px] bg-amber-950/40 text-amber-500 font-semibold rounded uppercase">
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

			{/* Right */}
			<div className="flex flex-wrap sm:flex-nowrap gap-4 text-sm justify-end flex-1">
				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Supplied</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(row.supplied_usd, 2)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Borrowed</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(row.borrowed_usd, 2)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Utilization</span>
					{row.utilization != null ? (
						<span className="text-zinc-100 font-mono">
							{formatPct(row.utilization)}
						</span>
					) : (
						<span className="text-zinc-800">—</span>
					)}
				</div>

				<div className="flex flex-col items-end min-w-20">
					<span className="text-zinc-500 text-xs">Solvency</span>
					{row.solvency_ratio != null ? (
						<span
							className={`font-mono ${isSolvent ? "text-cyan-200" : "text-pink-300 font-bold"}`}
						>
							{row.solvency_ratio.toFixed(2)}
						</span>
					) : (
						<span className="text-zinc-800">—</span>
					)}
					<span className="text-zinc-500 text-xs">
						{protocolLabel(row.protocol)}
					</span>
				</div>
			</div>
		</div>
	);
}

export async function MoneyMarketHealthFragment(
	ctx: PageContext,
	req: Bun.BunRequest<"/console/dashboard/fragments/mm-health">,
) {
	const { network, bucket, lookback, periodLabel } =
		parseDashboardParamsForDefi(req);

	// 1. Fetch State Snapshots
	const rows = await ctx.db.analytics.moneyMarketHealthSeries({
		network,
		bucket,
		lookback,
	});

	// 2. Fetch Aggregated Action Volumes
	const volumeRows = await ctx.db.analytics.defiVolumeSeries({
		network,
		bucket,
		lookback,
		type: "lending",
	});

	if (!rows || rows.length === 0) {
		return empty;
	}

	const uniquePoolsMap = new Map<string, MoneyMarketHealthRow>();
	for (const row of rows) {
		const key = `${row.protocol}:${row.market_id}`;
		const existing = uniquePoolsMap.get(key);
		if (!existing || new Date(row.ts) > new Date(existing.ts)) {
			uniquePoolsMap.set(key, row);
		}
	}

	const lastRows = Array.from(uniquePoolsMap.values()).sort((a, b) => {
		return b.supplied_usd - a.supplied_usd;
	});

	let currentTotalSupplied = 0;
	let currentTotalBorrowed = 0;
	for (const r of lastRows) {
		currentTotalSupplied += r.supplied_usd;
		currentTotalBorrowed += r.borrowed_usd;
	}

	const uniqueBaselineMap = new Map<string, MoneyMarketHealthRow>();
	for (let i = rows.length - 1; i >= 0; i--) {
		const row = rows[i];
		if (row) {
			const key = `${row.protocol}:${row.market_id}`;
			uniqueBaselineMap.set(key, row);
		}
	}

	let baselineTotalSupplied = 0;
	let baselineTotalBorrowed = 0;
	for (const r of uniqueBaselineMap.values()) {
		baselineTotalSupplied += r.supplied_usd;
		baselineTotalBorrowed += r.borrowed_usd;
	}

	const periodDeltaSuppliedPct =
		baselineTotalSupplied > 0
			? ((currentTotalSupplied - baselineTotalSupplied) /
					baselineTotalSupplied) *
				100
			: 0;

	const periodDeltaBorrowedPct =
		baselineTotalBorrowed > 0
			? ((currentTotalBorrowed - baselineTotalBorrowed) /
					baselineTotalBorrowed) *
				100
			: 0;

	let volumeSupplyTotal = 0;
	let volumeBorrowTotal = 0;
	let volumeRepayTotal = 0;
	let volumeLiquidateTotal = 0;

	const volTimelineMap = new Map<
		string,
		{ supply: number; borrow: number; repay: number; liquidate: number }
	>();

	if (volumeRows && volumeRows.length > 0) {
		for (const volRow of volumeRows) {
			const s = Number(volRow.supply_volume_usd ?? 0);
			const b = Number(volRow.borrow_volume_usd ?? 0);
			const r = Number(volRow.repay_volume_usd ?? 0);
			const l = Number(volRow.liquidation_volume_usd ?? 0);

			volumeSupplyTotal += s;
			volumeBorrowTotal += b;
			volumeRepayTotal += r;
			volumeLiquidateTotal += l;

			const tsKey = String(volRow.ts);
			const currentBucket = volTimelineMap.get(tsKey) || {
				supply: 0,
				borrow: 0,
				repay: 0,
				liquidate: 0,
			};

			currentBucket.supply += s;
			currentBucket.borrow += b;
			currentBucket.repay += r;
			currentBucket.liquidate += l;
			volTimelineMap.set(tsKey, currentBucket);
		}
	}

	// Extract lookback window baseline vs latest delta changes for volumes
	const sortedVolumeTimestamps = Array.from(volTimelineMap.keys()).sort(
		(a, b) => new Date(a).getTime() - new Date(b).getTime(),
	);

	let deltaVolSupplyPct = 0;
	let deltaVolBorrowPct = 0;
	let deltaVolRepayPct = 0;
	let deltaVolLiquidatePct = 0;

	if (sortedVolumeTimestamps.length > 0) {
		const first = sortedVolumeTimestamps[0] ?? "";
		const last =
			sortedVolumeTimestamps[sortedVolumeTimestamps.length - 1] ?? "";
		const earliestBucket = volTimelineMap.get(first);
		const latestBucket = volTimelineMap.get(last);
		const bucketsFound =
			earliestBucket !== undefined && latestBucket !== undefined;

		deltaVolSupplyPct =
			bucketsFound && earliestBucket.supply > 0
				? ((latestBucket.supply - earliestBucket.supply) /
						earliestBucket.supply) *
					100
				: 0;
		deltaVolBorrowPct =
			bucketsFound && earliestBucket.borrow > 0
				? ((latestBucket.borrow - earliestBucket.borrow) /
						earliestBucket.borrow) *
					100
				: 0;
		deltaVolRepayPct =
			bucketsFound && earliestBucket.repay > 0
				? ((latestBucket.repay - earliestBucket.repay) / earliestBucket.repay) *
					100
				: 0;
		deltaVolLiquidatePct =
			bucketsFound && earliestBucket.liquidate > 0
				? ((latestBucket.liquidate - earliestBucket.liquidate) /
						earliestBucket.liquidate) *
					100
				: 0;
	}

	return render(
		<div className="flex flex-col p-4 space-y-4">
			<h3 className="text-zinc-200 text-sm font-semibold">Lending Overview</h3>
			<div className="space-y-6">
				{/* KPIs */}
				<div className="flex flex-col gap-6 px-2">
					<div className="flex flex-wrap gap-8 md:gap-12">
						<Kpi
							title="Total Supplied"
							qty={`${formatNumberSI(currentTotalSupplied, 2)}`}
							delta={{ period: periodLabel, pct: periodDeltaSuppliedPct }}
						/>
						<Kpi
							title="Total Borrowed"
							qty={`${formatNumberSI(currentTotalBorrowed, 2)}`}
							delta={{ period: periodLabel, pct: periodDeltaBorrowedPct }}
						/>
					</div>

					<div className="flex flex-wrap gap-8 md:gap-12">
						{/* Transactional Action Stream Flow Metrics */}
						<Kpi
							title="Supply Volume"
							qty={`${formatNumberSI(volumeSupplyTotal, 2)}`}
							delta={{ period: periodLabel, pct: deltaVolSupplyPct }}
						/>
						<Kpi
							title="Borrow Volume"
							qty={`${formatNumberSI(volumeBorrowTotal, 2)}`}
							delta={{ period: periodLabel, pct: deltaVolBorrowPct }}
						/>
						<Kpi
							title="Repay Volume"
							qty={`${formatNumberSI(volumeRepayTotal, 2)}`}
							delta={{ period: periodLabel, pct: deltaVolRepayPct }}
						/>
						<Kpi
							title="Liquidation"
							qty={`${formatNumberSI(volumeLiquidateTotal, 2)}`}
							delta={{ period: periodLabel, pct: deltaVolLiquidatePct }}
						/>
					</div>
				</div>

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
								<MoneyMarketHealthCard row={r} />
							</div>
						))}
					</div>
					<PaginationControls />
				</div>
			</div>
		</div>,
	);
}
