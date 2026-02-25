import path from "node:path";
import { here } from "@/utils";
import { NETWORK_INFOS } from "./static/networks";

const BASE_CDN =
	"https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata";
const BASE_ASSETS_URL = `${BASE_CDN}/v2`;

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
	let lastErr: unknown;
	for (let i = 0; i <= retries; i++) {
		try {
			return await fn();
		} catch (e) {
			lastErr = e;
		}
	}
	throw lastErr;
}

export type NetworkInfo = {
	runtimeChain: string;
	chainDecimals?: number[];
	chainTokens?: string[];
	urn: string;

	icon?: string;
};

let networkInfos: Record<string, NetworkInfo> | null = null;
let chainIcons: string[] | null = null;
const iconCache: Record<string, string | null> = {};

const icons: Record<string, Bun.BunFile> = {};

export async function loadNetworkIconFiles(infos: NetworkInfo[]) {
	const fromHere = here(import.meta);
	const baseDir = fromHere("../../public/img/networks");

	for (const info of infos) {
		if (!info.icon) continue;

		const filePath = path.join(baseDir, info.icon);

		try {
			icons[info.icon] = Bun.file(filePath);
		} catch {
			console.warn(`Missing icon: ${info.icon}`);
		}
	}
}

export function getNetworkIconFile(name: string) {
	return icons[name] ?? null;
}

async function initNetworkInfos() {
	const networkInfos = Object.fromEntries(NETWORK_INFOS.map((c) => [c.urn, c]));
	await loadNetworkIconFiles(Object.values(networkInfos));
	return networkInfos;
}

async function fetchChainIcons() {
	const { items } = await withRetry(async () => {
		const res = await fetch(`${BASE_CDN}/chains-v2.json`);
		return res.json();
	});
	return items as string[];
}

export function resolveNetworkIcon(urn: string) {
	if (iconCache[urn] !== undefined) {
		return iconCache[urn];
	}

	const info = networkInfos?.[urn];
	if (!info) return null;
	if (info.icon) {
		const icon = `/img/networks/${info.icon}`;
		iconCache[urn] = icon;
		return icon;
	}

	if (!chainIcons) return null;

	const [, , chain, id = "0"] = urn.split(":");
	const path = `${chain}/${id}`;

	const match = chainIcons.find((p) => p.slice(0, p.lastIndexOf("/")) === path);

	const icon = match ? `${BASE_ASSETS_URL}/${match}` : null;
	iconCache[urn] = icon;

	return icon;
}

export type NetworkInfos = Awaited<ReturnType<typeof loadExtraInfos>>;

export async function loadExtraInfos() {
	if (!networkInfos) {
		networkInfos = await initNetworkInfos();
	}

	if (!chainIcons) {
		chainIcons = await fetchChainIcons();
	}

	return {
		resolveNetworkName: (urn: string) =>
			networkInfos?.[urn]?.runtimeChain ?? null,
		resolveNetworkIcon,
	};
}
