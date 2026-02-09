import { coerceNetworkId } from "@/server/api/params";
import { render } from "@/server/render";
import { InvalidParameters } from "@/server/response";
import { ConsoleApp } from "../../app";
import { withAuth } from "../../authenticated";
import { enrichEntityRows } from "../../util";
import { WatchlistForm } from "./watchlist.form";
import { CategoryRow, TagRow } from "./watchlist.form.rows";
import { WatchlistList } from "./watchlist.list";

export const WatchlistTagRowPage = withAuth(async ({ req }) => {
	if (!req.headers.get("HX-Request")) {
		return InvalidParameters;
	}

	return render(<TagRow />);
});

export const WatchlistCategoryRowPage = withAuth(async ({ req }) => {
	if (!req.headers.get("HX-Request")) {
		return InvalidParameters;
	}

	return render(<CategoryRow />);
});

export const WatchlistFormPage = withAuth<"/console/watchlist/form/:address">(
	async ({ db, req, user, ownerHash }) => {
		const address = req.params.address;

		const entity =
			address && address !== "__new__"
				? db.entities.findEntity({ owner: ownerHash, address })
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
	},
);

export const WatchlistPage = withAuth(async ({ db, req, user, ownerHash }) => {
	const url = new URL(req.url);

	const cursor = url.searchParams.get("cursor") ?? undefined;
	const network = coerceNetworkId(url.searchParams.get("networkId"));
	const category = Number(url.searchParams.get("category") ?? undefined);
	const search = url.searchParams.get("q") ?? undefined;

	const { rows, cursorNext } = db.entities.findEntities({
		owner: ownerHash,
		network,
		cursor,
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
		return render(<WatchlistList ctx={{ url }} page={page} />);
	}

	return render(
		<ConsoleApp member={user} path="/console/watchlist">
			<WatchlistList ctx={{ url }} page={page} />
		</ConsoleApp>,
	);
});
