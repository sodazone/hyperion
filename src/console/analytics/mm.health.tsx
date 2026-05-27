import type { MoneyMarketHealthRow } from "@/db/backend/duckdb/types";
import { render } from "@/server/render";
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
	const hasBadDebt = row.bad_debt_usd > 0;
	const isSolvent = row.solvency_ratio === null || row.solvency_ratio >= 0.99;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				<div className="flex items-center gap-2">
					<div className="text-zinc-100 font-semibold">{row.label}</div>
					{row.is_paused && (
						<span className="px-1 py-0.5 text-xs bg-red-950 text-red-400 font-semibold rounded uppercase">
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
						{protocolLabel(row.protocol)}
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
	const { network, bucket, lookback, periodLabel } =
		parseDashboardParamsForDefi(req);

	const rows = (await ctx.db.analytics.moneyMarketHealthSeries({
		network,
		bucket,
		lookback,
	})) as MoneyMarketHealthRow[];

	if (!rows || rows.length === 0) {
		return render(
			<div className="px-4 py-6 text-sm text-zinc-500">
				No lending health data yet.
			</div>,
		);
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
		if (a.bad_debt_usd > 0 !== b.bad_debt_usd > 0) {
			return a.bad_debt_usd > 0 ? -1 : 1;
		}
		return (a.solvency_ratio ?? 999) - (b.solvency_ratio ?? 999);
	});

	let currentTotalSupplied = 0;
	let currentTotalBadDebt = 0;
	for (const r of lastRows) {
		currentTotalSupplied += r.supplied_usd;
		currentTotalBadDebt += r.bad_debt_usd;
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
	for (const r of uniqueBaselineMap.values()) {
		baselineTotalSupplied += r.supplied_usd;
	}

	const periodDeltaUsd = currentTotalSupplied - baselineTotalSupplied;
	const periodDeltaPct =
		baselineTotalSupplied > 0
			? (periodDeltaUsd / baselineTotalSupplied) * 100
			: 0;

	return render(
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row gap-4">
				<Kpi
					title="Total Supplied"
					qty={`${formatNumberSI(currentTotalSupplied, 2)}`}
					period={periodLabel}
					deltaPct={periodDeltaPct}
				/>
				{currentTotalBadDebt > 0 && (
					<div className="flex flex-col gap-1 p-3 bg-red-950/20 border border-red-900/40 rounded-xl min-w-50">
						<span className="text-xs text-red-400 font-medium">
							Total Bad Debt
						</span>
						<span className="text-2xl font-bold text-red-200 font-mono tracking-tight">
							${formatNumberSI(currentTotalBadDebt, 2)}
						</span>
						<span className="text-xs text-red-500 font-medium font-mono">
							Insolvent Position
						</span>
					</div>
				)}
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
		</div>,
	);
}
