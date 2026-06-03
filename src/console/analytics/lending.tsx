import type { MoneyMarketHealthRow } from "@/db/backend/duckdb/types";
import { empty, render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { CopyButton } from "../components/btn.copy";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { formatPct, protocolLabel } from "./format";
import { asDelta, calculateKpis, Kpi } from "./kpi";
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

	const rows = await ctx.db.analytics.moneyMarketHealthSeries({
		network,
		bucket,
		lookback,
	});
	const volumeRows = await ctx.db.analytics.defiVolume({
		network,
		bucket,
		lookback,
		type: "lending",
	});

	if (!rows || rows.length === 0) {
		return empty;
	}

	const healthMetrics = calculateKpis(
		rows,
		[{ key: "supplied_usd" }, { key: "borrowed_usd" }],
		{
			dateKey: "ts",
			entityKey: (r) => `${r.protocol}:${r.market_id}`,
		},
	);

	const volumes = {
		borrow: {
			c: 0,
			p: 0,
		},
		repay: {
			c: 0,
			p: 0,
		},
		liquidate: {
			c: 0,
			p: 0,
		},
	};
	for (const v of volumeRows) {
		volumes.borrow.c += Number(v.current_borrow_volume_usd ?? 0);
		volumes.borrow.p += Number(v.previous_borrow_volume_usd ?? 0);
		volumes.repay.c += Number(v.current_repay_volume_usd ?? 0);
		volumes.repay.p += Number(v.previous_repay_volume_usd ?? 0);
		volumes.liquidate.c += Number(v.current_liquidation_volume_usd ?? 0);
		volumes.liquidate.p += Number(v.previous_liquidation_volume_usd ?? 0);
	}

	const borrowKpi = asDelta(volumes.borrow.c, volumes.borrow.p);
	const repayKpi = asDelta(volumes.repay.c, volumes.repay.p);
	const liquidateKpi = asDelta(volumes.liquidate.c, volumes.liquidate.p);

	// Sort layout cards
	const uniquePoolsMap = new Map<string, MoneyMarketHealthRow>();
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
			<h3 className="text-zinc-200 text-sm font-semibold">Lending Overview</h3>
			<div className="space-y-6">
				<div className="flex flex-col gap-6 px-2">
					{/* KPIs State */}
					<div className="flex flex-wrap gap-8 md:gap-12">
						<Kpi
							title="Total Supplied"
							qty={`$${formatNumberSI(healthMetrics.supplied_usd.total, 2)}`}
							delta={{
								period: periodLabel,
								pct: healthMetrics.supplied_usd.deltaPct,
							}}
						/>
						<Kpi
							title="Total Borrowed"
							qty={`$${formatNumberSI(healthMetrics.borrowed_usd.total, 2)}`}
							delta={{
								period: periodLabel,
								pct: healthMetrics.borrowed_usd.deltaPct,
							}}
						/>
					</div>

					{/* KPIs Volume */}
					<div className="flex flex-wrap gap-8 md:gap-12">
						<Kpi
							title="Borrow Volume"
							qty={`$${formatNumberSI(borrowKpi.total, 2)}`}
							delta={{
								period: periodLabel,
								pct: borrowKpi.deltaPct,
							}}
						/>
						<Kpi
							title="Repay Volume"
							qty={`$${formatNumberSI(repayKpi.total, 2)}`}
							delta={{
								period: periodLabel,
								pct: repayKpi.deltaPct,
							}}
						/>
						<Kpi
							title="Liquidation"
							qty={`$${formatNumberSI(liquidateKpi.total, 2)}`}
							delta={{
								period: periodLabel,
								pct: liquidateKpi.deltaPct,
							}}
						/>
					</div>
				</div>

				{/* Markets */}
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
