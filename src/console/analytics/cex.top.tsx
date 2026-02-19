import { render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import type { PageContext } from "../types";
import { ExchangeName } from "./cex.names";
import { parseDashboardParams } from "./params";

export async function TopExchangesFragment(
	ctx: PageContext,
	req: Bun.BunRequest<string>,
) {
	const { bucket, network, lookback } = parseDashboardParams(req);
	const data = (await ctx.db.analytics.cexTop({
		bucket,
		lookback,
		network,
		limit: 10,
	})) as any[];

	return render(
		<table className="w-full table-auto border-collapse text-sm">
			<thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-400">
				<tr>
					<th className="px-4 py-2 text-left">Exchange</th>
					<th className="px-4 py-2 text-right">Inflow</th>
					<th className="px-4 py-2 text-right">Outflow</th>
					<th className="px-4 py-2 text-right">Net Flow</th>
				</tr>
			</thead>
			<tbody className="divide-y divide-zinc-900/90">
				{data.length === 0 && (
					<tr>
						<td
							colSpan={4}
							className="px-4 py-6 text-xs text-zinc-300 text-center"
						>
							No data available
						</td>
					</tr>
				)}
				{data.map((row) => (
					<tr key={row.exchange}>
						<td className="px-4 py-2 text-xs text-zinc-100">
							<ExchangeName tag={row.exchange} />
						</td>
						<td className="text-right font-mono px-4 py-2 text-xs text-zinc-100">
							{formatNumberSI(row.inflow_usd)}
						</td>
						<td className="text-right font-mono px-4 py-2 text-xs text-zinc-100">
							{formatNumberSI(row.outflow_usd)}
						</td>
						<td
							className={`text-right font-mono px-4 py-2 text-xs ${row.netflow_usd >= 0 ? "text-cyan-200" : "text-pink-300"}`}
						>
							{formatNumberSI(row.netflow_usd)}
						</td>
					</tr>
				))}
			</tbody>
		</table>,
	);
}
