import { safeString } from "@/utils/strings";

export type BucketString = "hour" | "day";
export const BUCKETS = ["hour", "day"];

export const NETWORK_OPTIONS = [
	{
		label: "Polkadot",
		value: "urn:ocn:polkadot:1000",
		icon: "https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata/v2/polkadot/0/icon.svg",
	},
	{
		label: "Hydration",
		value: "urn:ocn:polkadot:2034",
		icon: "https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata/v2/polkadot/2034/icon.svg",
	},
	{
		label: "Moonbeam",
		value: "urn:ocn:polkadot:2004",
		icon: "https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata/v2/polkadot/2004/icon.svg",
	},
];
export const NETWORKS = NETWORK_OPTIONS.map((opt) => opt.value);

export function parseDashboardParams(req: Bun.BunRequest) {
	const url = new URL(req.url);

	const paramBucket = url.searchParams.get("bucket") as string;
	const bucket = BUCKETS.includes(paramBucket)
		? (paramBucket as BucketString)
		: undefined;
	const paramNetwork = url.searchParams.get("network") as string;
	const network = NETWORKS.includes(paramNetwork) ? paramNetwork : undefined;

	let lookback = parseInt(url.searchParams.get("lookback") || "", 10);
	if (Number.isNaN(lookback) || lookback <= 0 || lookback > 365)
		lookback = bucket === "hour" ? 24 : 30;

	const exchange = safeString(url.searchParams.get("exchange")) || undefined;

	return {
		bucket,
		network,
		lookback,
		exchange,
	};
}
