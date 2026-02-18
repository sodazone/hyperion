import { render } from "@/server/render";
import { formatNumberSI } from "@/utils/amounts";
import { ConsoleApp } from "../app";
import type { PageContext } from "../types";
import { ExchangeName } from "./cex.names";
import { BUCKETS, type BucketString, Dashboard, NETWORKS } from "./dashboard";

// TODO: use as well in server/analytics
// merge the params parsing and validation
function parseParams(req: Bun.BunRequest) {
	const url = new URL(req.url);

	const paramBucket = url.searchParams.get("bucket") as string;
	const bucket = BUCKETS.includes(paramBucket)
		? (paramBucket as BucketString)
		: undefined;
	const paramNetwork = url.searchParams.get("network") as string;
	const network = NETWORKS.includes(paramNetwork) ? paramNetwork : undefined;

	return { bucket, network };
}

export async function TopExchangesFragment(
	ctx: PageContext,
	req: Bun.BunRequest<string>,
) {
	const { bucket, network } = parseParams(req);
	const data = (await ctx.db.analytics.cexTop({
		bucket,
		lookback: bucket === "hour" ? 24 : 30,
		network,
		limit: 10,
	})) as any[];

	return render(
		<table className="w-full table-auto border-collapse text-sm">
			<thead>
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

export function DashboardPage(_ctx: PageContext, req: Bun.BunRequest) {
	const { bucket, network } = parseParams(req);

	if (req.headers.get("HX-Request"))
		return render(<Dashboard bucket={bucket} network={network} />);

	return render(
		<ConsoleApp path="/console/dashboard">
			<Dashboard bucket={bucket} network={network} />
		</ConsoleApp>,
	);
}
