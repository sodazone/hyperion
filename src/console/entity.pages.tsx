import { ConsoleApp } from "@/console/app";
import { EntityDetailsView } from "@/console/entity.detail";
import { EntitiesView } from "@/console/entity.list";
import type { NetworkInfos } from "@/console/extra.infos";
import { type Entity, type HyperionDB, PUBLIC_OWNER } from "@/db";
import { analyzeAddressAllNetworks } from "@/intel/api";
import { NetworkMap } from "@/intel/mapping";
import type { AuthApi } from "@/server/auth/stytch";
import { coerceNetworkId } from "@/server/intel/params";
import { render } from "@/server/render";
import type { EntityRow } from "./types";

type Context = {
	db: HyperionDB;
	networkInfos: NetworkInfos;
	authApi: AuthApi;
};

const enrichRows = (rows: Entity[]): Array<EntityRow> => {
	return rows.map((e) => {
		const networksSet = new Set<number>();
		const categoriesSet = new Set<number>();
		const tagsSet = new Set<string>();

		e.categories?.forEach((c) => {
			networksSet.add(c.network);
			categoriesSet.add(c.category);
		});
		e.tags?.forEach((t) => {
			networksSet.add(t.network);
			tagsSet.add(t.tag);
		});

		return {
			...e,
			sets: {
				networks: Array.from(networksSet).map(NetworkMap.toURN),
				categories: Array.from(categoriesSet),
				tags: Array.from(tagsSet),
			},
		};
	});
};

export async function EntityListPage(
	{ db, networkInfos, authApi }: Context,
	req: Bun.BunRequest,
) {
	const url = new URL(req.url);

	const cursor = url.searchParams.get("cursor") ?? undefined;
	const network = coerceNetworkId(url.searchParams.get("networkId"));
	const category = Number(url.searchParams.get("category") ?? undefined);
	const search = url.searchParams.get("q") ?? undefined;

	const { rows, cursorNext } = db.search.findEntities({
		owner: PUBLIC_OWNER,
		network,
		cursor,
		// tag: "phishing_domain:polkadot-bonus.network",
		category: Number.isNaN(category) ? undefined : category,
		limit: 15,
		address: search,
	});

	const page = {
		rows: enrichRows(rows),
		cursorNext,
		cursorCurrent: cursor,
		filters: {
			category: category?.toString(),
			networkId: network?.toString(),
			q: search,
		},
	};

	if (req.headers.get("HX-Request")) {
		return render(<EntitiesView ctx={{ networkInfos }} page={page} />);
	}

	const user = await authApi.getAuthenticatedUser(req);

	return render(
		<ConsoleApp member={user} path="/console/entities">
			<EntitiesView ctx={{ networkInfos }} page={page} />
		</ConsoleApp>,
	);
}

export function EntityDetailPage(
	{ db, networkInfos }: Context,
	req: Bun.BunRequest<"/console/entities/:id">,
) {
	const address = req.params.id;

	if (!address) {
		throw new Error("Missing  address");
	}

	const entity = analyzeAddressAllNetworks(db, address);

	if (!entity || entity.networks.length === 0) {
		throw new Error("Entity not found");
	}

	if (req.headers.get("HX-Request")) {
		return render(<EntityDetailsView ctx={{ networkInfos }} entity={entity} />);
	}

	return render(
		<ConsoleApp path="/console/entities">
			<EntityDetailsView ctx={{ networkInfos }} entity={entity} />
		</ConsoleApp>,
	);
}
