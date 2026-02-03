import { hashOwner } from "@/auth";
import { coerceNetworkId } from "@/server/intel/params";
import { render } from "@/server/render";
import { InvalidParameters, Unauthorized } from "@/server/response";
import { ConsoleApp } from "../../app";
import type { PageContext } from "../../types";
import { enrichEntityRows } from "../../util";
import { WatchlistForm } from "./watchlist.form";
import { CategoryRow, TagRow } from "./watchlist.form.rows";
import { WatchlistList } from "./watchlist.list";

export async function WatchlistTagRowPage(req: Request) {
	if (!req.headers.get("HX-Request")) {
		return InvalidParameters;
	}

	return render(<TagRow />);
}

export async function WatchlistCategoryRowPage(req: Request) {
	if (!req.headers.get("HX-Request")) {
		return InvalidParameters;
	}

	return render(<CategoryRow />);
}

export async function WatchlistFormPage(
	{ db, networkInfos, authApi }: PageContext,
	req: Bun.BunRequest<"/console/watchlist/form/:address">,
) {
	const user = await authApi.getAuthenticatedUser(req);
	if (!user) return Unauthorized;

	const address = req.params.address;

	const entity =
		address && address !== "__new__"
			? db.findEntity({ owner: hashOwner(user.email), address })
			: undefined;

	const form = <WatchlistForm entity={entity} />;

	// htmx fragment
	if (req.headers.get("HX-Request")) {
		return render(form);
	}

	// full page
	return render(
		<ConsoleApp member={user} path="/console/watchlist">
			{form}
		</ConsoleApp>,
	);
}

export async function WatchlistPage(
	{ db, networkInfos, authApi }: PageContext,
	req: Bun.BunRequest,
) {
	const user = await authApi.getAuthenticatedUser(req);

	if (user == null) {
		return Unauthorized;
	}

	const url = new URL(req.url);

	const cursor = url.searchParams.get("cursor") ?? undefined;
	const network = coerceNetworkId(url.searchParams.get("networkId"));
	const category = Number(url.searchParams.get("category") ?? undefined);
	const search = url.searchParams.get("q") ?? undefined;

	const owner = hashOwner(user.email);
	const { rows, cursorNext } = db.search.findEntities({
		owner,
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
		return render(<WatchlistList ctx={{ networkInfos }} page={page} />);
	}

	return render(
		<ConsoleApp member={user} path="/console/watchlist">
			<WatchlistList ctx={{ networkInfos }} page={page} />
		</ConsoleApp>,
	);
}
