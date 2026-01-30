import { ConsoleApp } from "@/console/app";
import { EntityDetailsView } from "@/console/entity.detail";
import { EntitiesView } from "@/console/entity.list";
import type { NetworkInfos } from "@/console/extra.infos";
import type { HyperionDB } from "@/db";
import { analyzeAddressAllNetworks } from "@/intel/api";
import type { AuthApi } from "@/server/auth/stytch";
import { coerceNetworkId } from "@/server/intel/params";
import { render } from "@/server/render";

type Context = {
	db: HyperionDB;
	networkInfos: NetworkInfos;
	authApi: AuthApi;
};

export async function EntityListPage(
	{ db, networkInfos, authApi }: Context,
	req: Bun.BunRequest,
) {
	const url = new URL(req.url);

	const cursor = url.searchParams.get("cursor") ?? undefined;
	const networkId = coerceNetworkId(url.searchParams.get("networkId"));
	const category = Number(url.searchParams.get("category") ?? undefined);
	const search = url.searchParams.get("q") ?? undefined;

	const { rows, cursorNext } = db.search.findEntities({
		networkId,
		cursor,
		categoryCode: Number.isNaN(category) ? undefined : category,
		limit: 15,
		searchPrefix: search,
	});

	const page = {
		rows,
		cursorNext,
		cursorCurrent: cursor,
		filters: {
			category: category?.toString(),
			networkId: networkId?.toString(),
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
