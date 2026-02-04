import { ConsoleApp } from "@/console/app";
import { EntityDetailsView } from "@/console/public/entity/entity.detail";
import { EntitiesList } from "@/console/public/entity/entity.list";
import { PUBLIC_OWNER } from "@/db";
import { analyzeAddressAllNetworks } from "@/intel/api";
import { coerceNetworkId } from "@/server/api/params";
import { render } from "@/server/render";
import type { PageContext } from "../../types";
import { enrichEntityRows } from "../../util";

export async function EntityListPage(
	{ db, authApi }: PageContext,
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
		rows: enrichEntityRows(rows),
		cursorNext,
		cursorCurrent: cursor,
		filters: {
			category: category?.toString(),
			networkId: network?.toString(),
			q: search,
		},
	};

	if (req.headers.get("HX-Request")) {
		return render(<EntitiesList ctx={{ url }} page={page} />);
	}

	const user = await authApi.getAuthenticatedUser(req);

	return render(
		<ConsoleApp member={user} path="/console/entities">
			<EntitiesList ctx={{ url }} page={page} />
		</ConsoleApp>,
	);
}

export async function EntityDetailPage(
	{ db, authApi }: PageContext,
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
		return render(<EntityDetailsView entity={entity} />);
	}

	const user = await authApi.getAuthenticatedUser(req);

	return render(
		<ConsoleApp member={user} path="/console/entities">
			<EntityDetailsView entity={entity} />
		</ConsoleApp>,
	);
}
