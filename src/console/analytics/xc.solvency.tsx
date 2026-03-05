import type { CrosschainSolvencyRow } from "@/db/backend/duckdb/types";
import { render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { CopyButton } from "../components/btn.copy";
import { NetworkName } from "../components/network.icon";
import type { PageContext } from "../types";
import { truncMid } from "../util";
import { parseDashboardParams } from "./params";

const ROWS_PER_PAGE = 5;

function pct(n: number | null) {
	if (n === null) return "—";
	return `${(n * 100).toFixed(2)}%`;
}

export function SolvencyCard({ row }: { row: CrosschainSolvencyRow }) {
	const healthy = row.difference >= 0;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-2 gap-2">
			{/* Left: Network / Asset / Collapsed Reserve */}
			<div className="flex flex-col gap-0.5 min-w-37.5">
				<div className="text-xs text-zinc-500 truncate">
					<NetworkName urn={row.reserve_chain} />
				</div>

				<div className="text-sm font-semibold text-zinc-100 truncate">
					{row.asset_symbol}
				</div>

				<div className="text-xs text-zinc-500">
					<span className="flex gap-1 items-center font-mono truncate">
						<span className="truncate">{truncMid(row.reserve_address)}</span>
						<CopyButton
							title="Copy Reserve Address"
							text={row.reserve_address}
							size={12}
						/>
					</span>
				</div>
			</div>

			{/* Right: Metrics */}
			<div className="flex flex-wrap sm:flex-nowrap gap-4 text-sm justify-end flex-1">
				<div className="flex flex-col items-end min-w-15">
					<span className="text-zinc-500 text-xs">Reserve</span>
					<span className="text-zinc-100">
						{formatNumberSI(row.reserve_balance)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-15">
					<span className="text-zinc-500 text-xs">Remote</span>
					<span className="text-zinc-100">
						{formatNumberSI(row.remote_balance)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-15">
					<span className="text-zinc-500 text-xs">Δ</span>
					<span className={healthy ? "text-cyan-200" : "text-pink-300"}>
						{formatNumberSI(row.difference, 4)}
					</span>
				</div>

				<div className="flex flex-col items-end min-w-15">
					<span className="text-zinc-500 text-xs">Ratio</span>
					<span
						className={
							row.collateral_ratio !== null && row.collateral_ratio < 1
								? "text-pink-300"
								: "text-zinc-100"
						}
					>
						{pct(row.collateral_ratio)}
					</span>
				</div>
			</div>
		</div>
	);
}

export async function CrosschainSolvencyFragment(
	ctx: PageContext,
	req: Bun.BunRequest<"/console/dashboard/fragments/xc-solvency">,
) {
	const { network } = parseDashboardParams(req);

	const rows = await ctx.db.analytics.solvencyByRemoteChain(
		network ?? "urn:ocn:polkadot:1000",
	);

	if (rows.length === 0) {
		return render(
			<div className="px-4 py-6 text-sm text-zinc-500">No data yet.</div>,
		);
	}

	return render(
		<div
			x-data={`pagination({totalItems: ${rows.length}, perPage: ${ROWS_PER_PAGE}})`}
			className="space-y-4"
		>
			<div className="flex flex-col divide-y divide-zinc-900">
				{rows.map((r, index) => (
					<div key={r.asset_id} x-show={`isVisible(${index + 1})`}>
						<SolvencyCard row={r} />
					</div>
				))}
			</div>
			<div
				className="flex justify-end space-x-2 mt-4"
				x-show="totalPages() > 1"
			>
				<button
					x-bind:disabled="currentPage === 1"
					x-on:click="prevPage()"
					className="ui-btn text-xs"
					type="button"
				>
					Prev
				</button>

				<template x-for="page in totalPages()" x-bind:key="page">
					<button
						x-on:click="goToPage(page)"
						x-bind:class="{'bg-zinc-900 font-semibold text-zinc-100': currentPage === page}"
						className="ui-btn text-xs"
						type="button"
					>
						<span x-text="page"></span>
					</button>
				</template>

				<button
					x-bind:disabled="currentPage === totalPages()"
					x-on:click="nextPage()"
					className="ui-btn text-xs"
					type="button"
				>
					Next
				</button>
			</div>
		</div>,
	);
}
