import { formatNumberSI } from "@/utils/amounts";

export function protocolLabel(protocol: string) {
	return protocol.indexOf(".") > -1 ? protocol.split(".")[1] : protocol;
}

export function monetaryDelta(qty: number) {
	return `${qty >= 0 ? "$" : "-$"}${formatNumberSI(Math.abs(qty), 2)}`;
}

export function formatPct(n: number | null) {
	if (n === null || n === undefined) return "—";
	return `${(n * 100).toFixed(1)}%`;
}
