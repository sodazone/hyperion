import type { DexLiquidityRow } from "@/db/backend/duckdb/types";
import { render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { dateFormatter } from "@/utils/dates";
import { CopyButton } from "../components/btn.copy";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { PaginationControls } from "./pagination";
import { parseDashboardParams } from "./params";

const ROWS_PER_PAGE = 5;

export function DexLiquidityCard({ row }: { row: DexLiquidityRow }) {
	const isPositive = row.tvl_change_usd >= 0;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left: Protocol & Pool Name */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				<span className="text-xs text-zinc-500 tracking-wide font-mono">
					{dateFormatter.format(new Date(row.ts))}
				</span>
				<div className="text-zinc-100 font-semibold">{row.label}</div>
				<div className="text-xs text-zinc-500">
					<span className="flex gap-1 items-center font-mono truncate">
						<span className="truncate">{truncMid(row.market_id)}</span>
						<CopyButton title="Copy Address" text={row.market_id} size={12} />
					</span>
				</div>
			</div>

			{/* Right: Core Liquidity Metrics */}
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
						${formatNumberSI(row.tvl_change_usd, 2)}
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

export async function DexLiquidityFragment(
	ctx: PageContext,
	req: Bun.BunRequest<"/console/dashboard/fragments/dex-liquidity">,
) {
	const { network: _network } = parseDashboardParams(req);

	let network = _network ?? "urn:ocn:polkadot:1000";
	if (network === "urn:ocn:polkadot:2004") {
		network = "urn:ocn:ethereum:1284";
	}

	const rows = (await ctx.db.analytics.dexLiquiditySeries({
		network,
		bucket: "day",
		lookback: 7,
	})) as DexLiquidityRow[];

	if (!rows || rows.length === 0) {
		return render(
			<div className="px-4 py-6 text-sm text-zinc-500">
				No exchange data yet.
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
						<DexLiquidityCard row={r} />
					</div>
				))}
			</div>
			<PaginationControls />
		</div>,
	);
}
