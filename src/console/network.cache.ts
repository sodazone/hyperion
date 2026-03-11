import { NetworkMap } from "@/intel/mapping";
import { loadExtraInfos } from "./extra.infos";

const MONITORED_CONSENSUS = ["polkadot", "kusama", "ethereum", "sui", "solana"];

type CachedNetwork = {
	id: number;
	urn: string;
	name: string;
	icon: string | null;
};

let cache: {
	all(): readonly CachedNetwork[];
	hot(): readonly CachedNetwork[];
	fromId(id: number): CachedNetwork | undefined;
	fromURN(urn: string): CachedNetwork | undefined;
	name(urn: string): string | undefined;
	icon(urn: string): string | null | undefined;
} | null = null;

export async function initNetworkCache() {
	const { resolveNetworkIcon, resolveNetworkName } = await loadExtraInfos();

	const list: CachedNetwork[] = [];
	const byId = new Map<number, CachedNetwork>();
	const byURN = new Map<string, CachedNetwork>();

	for (const [urn, id] of NetworkMap.entries()) {
		const entry: CachedNetwork = {
			id,
			urn,
			name: resolveNetworkName(urn) ?? urn,
			icon: resolveNetworkIcon(urn),
		};

		list.push(entry);
		byId.set(id, entry);
		byURN.set(urn, entry);
	}

	list.sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
	);

	const hot = list.filter((n) =>
		MONITORED_CONSENSUS.includes(n.urn.split(":")[2] ?? "_"),
	);

	cache = {
		all: () => list,
		hot: () => hot,
		fromId: (id) => byId.get(id),
		fromURN: (urn) => byURN.get(urn),
		name: (urn) => byURN.get(urn)?.name,
		icon: (urn) => byURN.get(urn)?.icon,
	};
}

function getCache() {
	if (!cache) {
		throw new Error(
			"NetworkCache not initialized. Call initNetworkCache() at server startup.",
		);
	}
	return cache;
}

export const NetworkCache = {
	all: () => getCache().all(),
	hot: () => getCache().hot(),
	fromId: (id: number) => getCache().fromId(id),
	fromURN: (urn: string) => getCache().fromURN(urn),
	name: (urn: string) => getCache().name(urn),
	icon: (urn: string) => getCache().icon(urn),
};
