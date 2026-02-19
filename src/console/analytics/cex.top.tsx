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
			<thead className="bg-zinc-800">
				<tr className="font-semibold">
					<th className="text-left">Exchange</th>
					<th className="text-right">Inflow (USD)</th>
					<th className="text-right">Outflow (USD)</th>
					<th className="text-right">Net Flow (USD)</th>
				</tr>
			</thead>
			<tbody>
				{data.map((row) => (
					<tr key={row.exchange}>
						<td>
							<ExchangeName tag={row.exchange} />
						</td>
						<td className="text-right font-mono">
							{formatNumberSI(row.inflow_usd)}
						</td>
						<td className="text-right font-mono">
							{formatNumberSI(row.outflow_usd)}
						</td>
						<td className="text-right font-mono">
							{formatNumberSI(row.netflow_usd)}
						</td>
					</tr>
				))}
			</tbody>
		</table>,
	);
}
