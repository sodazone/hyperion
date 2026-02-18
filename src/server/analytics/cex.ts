import type { PageContext } from "@/console/types";

export const CexSeriesHandler = async (
	ctx: PageContext,
	req: Bun.BunRequest,
) => {
	try {
		// TODO use console/analytics/helpers for params parsing
		const url = new URL(req.url);

		const bucket = url.searchParams.get("bucket") === "hour" ? "hour" : "day";
		const network = url.searchParams.get("network");

		let lookback = parseInt(url.searchParams.get("lookback") || "", 10);
		if (Number.isNaN(lookback) || lookback <= 0 || lookback > 365)
			lookback = bucket === "hour" ? 24 : 30;

		const exchange = url.searchParams.get("exchange")?.trim() || undefined;

		const data = await ctx.db.analytics.cexSeries({
			bucket,
			lookback,
			exchange,
			network: network === "*" ? undefined : (network ?? undefined),
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
