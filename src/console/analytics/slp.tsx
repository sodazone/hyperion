import type { LiquidStakingRow } from "@/db/backend/duckdb/types";
import { empty, render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { NetworkName } from "../components/network.icon";
import type { PageContext } from "../types";
import { monetaryDelta, protocolLabel } from "./format";
import { asDelta, calculateKpis, Kpi } from "./kpi";
import { PaginationControls } from "./pagination";
import { parseDashboardParamsForDefi } from "./params";

const ROWS_PER_PAGE = 5;
const EMPTY_KPI = { total: 0, deltaPct: 0 };

export function LiquidStakingCard({
	row,
	dataPoints,
	period,
	volumeUsd,
}: {
	row: LiquidStakingRow;
	dataPoints: number[];
	period: string;
	volumeUsd?: Volume;
}) {
	const tvlChange =
		dataPoints.length > 1
			? (dataPoints[dataPoints.length - 1] ?? 0) - (dataPoints[0] ?? 0)
			: 0;
	const isPositive = tvlChange >= 0;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				{row.staking_network && (
					<div className="text-xs text-zinc-500 truncate">
						<NetworkName urn={row.staking_network} />
					</div>
				)}
				<div className="text-zinc-100 font-semibold text-sm">{row.label}</div>
			</div>

			{/* Right */}
			<div className="flex flex-wrap sm:flex-nowrap gap-4 text-sm justify-end flex-1">
				<div className="flex flex-col gap-0.5 items-end min-w-20">
					<span className="text-zinc-500 text-xs">Mint Vol</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(volumeUsd?.mint.c ?? 0, 2)}
					</span>
				</div>

				<div className="flex flex-col gap-0.5 items-end min-w-20">
					<span className="text-zinc-500 text-xs">Redeem Vol</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(volumeUsd?.redeem.c ?? 0, 2)}
					</span>
				</div>

				<div className="flex flex-col gap-0.5 items-end min-w-20">
					<span className="text-zinc-500 text-xs">Exch. Rate</span>
					<span className="text-zinc-100 font-mono">
						{row.exchange_rate > 0 ? row.exchange_rate.toFixed(4) : "1.000"}
					</span>
				</div>

				<div className="flex flex-col gap-0.5 items-end min-w-20">
					<span className="text-zinc-500 text-xs">TVL</span>
					<span className="text-zinc-100 font-mono">
						${formatNumberSI(row.supplied_usd, 2)}
					</span>
				</div>

				<div className="flex flex-col gap-0.5 items-end min-w-20">
					<span className="text-zinc-500 text-xs">Δ</span>
					<span
						className={`font-mono ${isPositive ? "text-cyan-200" : "text-pink-300"}`}
					>
						{monetaryDelta(tvlChange)}
					</span>
					<div className="text-zinc-500 text-xs">
						{protocolLabel(row.protocol)}
					</div>
				</div>

				<div className="flex flex-col gap-0.5 items-end min-w-20">
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

type Volume = {
	redeem: { c: number; p: number };
	mint: { c: number; p: number };
};

export async function LiquidStakingFragment(
	ctx: PageContext,
	req: Bun.BunRequest<"/console/dashboard/fragments/slp-liquidity">,
) {
	const { network, bucket, lookback, periodLabel } =
		parseDashboardParamsForDefi(req);

	const rows = await ctx.db.analytics.slpLiquiditySeries({
		network,
		bucket,
		lookback,
	});

	const volumeRows = await ctx.db.analytics.defiVolume({
		network,
		bucket,
		lookback,
		type: "liquid-staking",
	});

	if (!rows || rows.length === 0) {
		return empty;
	}

	const liquidityMetrics = calculateKpis(
		rows,
		[{ key: "total_aggregate_tvl_usd" }],
		{ dateKey: "ts" },
	);

	const { total_aggregate_tvl_usd: tvlKpi = EMPTY_KPI } = liquidityMetrics;

	const lstVolumeMap = new Map<string, Volume>();
	const volumes = {
		redeem: { c: 0, p: 0 },
		mint: { c: 0, p: 0 },
	};

	if (volumeRows) {
		for (const volRow of volumeRows) {
			const key = `${volRow.protocol}:${volRow.market_id}`;
			const v = {
				mint: {
					c: Number(volRow.current_lst_mint_volume_usd ?? 0),
					p: Number(volRow.previous_lst_mint_volume_usd ?? 0),
				},
				redeem: {
					c: Number(volRow.current_lst_redeem_volume_usd ?? 0),
					p: Number(volRow.previous_lst_redeem_volume_usd ?? 0),
				},
			};

			lstVolumeMap.set(key, v);

			volumes.mint.c += v.mint.c;
			volumes.mint.p += v.mint.p;
			volumes.redeem.c += v.redeem.c;
			volumes.redeem.p += v.redeem.p;
		}
	}

	const kpis = {
		mint: asDelta(volumes.mint.c, volumes.mint.p),
		redeem: asDelta(volumes.redeem.c, volumes.redeem.p),
	};

	// Deduplicate protocol assets
	const uniquePoolsMap = new Map<string, LiquidStakingRow>();
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
			<h3 className="text-zinc-200 text-sm font-semibold">Liquid Staking</h3>
			<div className="space-y-6">
				{/* KPIs */}
				<div className="px-2 flex flex-wrap gap-8 md:gap-12">
					<Kpi
						title="Total Value Staked"
						qty={`$${formatNumberSI(tvlKpi.total, 2)}`}
						delta={{ period: periodLabel, pct: tvlKpi.deltaPct }}
					/>
					<Kpi
						title="Mint Volume"
						qty={`$${formatNumberSI(kpis.mint.total, 2)}`}
						delta={{ period: periodLabel, pct: kpis.mint.deltaPct }}
					/>
					<Kpi
						title="Redeem Volume"
						qty={`$${formatNumberSI(kpis.redeem.total, 2)}`}
						delta={{ period: periodLabel, pct: kpis.redeem.deltaPct }}
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
							const totalPoolVolume = lstVolumeMap.get(poolKey);
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
									<LiquidStakingCard
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
