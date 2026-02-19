import { parseDashboardParams } from "@/console/analytics/params";
import type { PageContext } from "@/console/types";

export const CexSeriesHandler = async (
	ctx: PageContext,
	req: Bun.BunRequest,
) => {
	try {
		const { bucket, lookback, exchange, network } = parseDashboardParams(req);
		const data = await ctx.db.analytics.cexSeries({
			bucket,
			lookback,
			exchange,
			network,
		});
		return Response.json(data);
	} catch (err) {
		console.error("Error fetching CEX flows:", err);
		return Response.json(
			{ error: "Failed to fetch CEX flows" },
			{ status: 500 },
		);
	}
};
