import { PUBLIC_OWNER } from "@/db";
import { render } from "@/server/render";
import { ConsoleApp } from "../../app";
import type { PageContext } from "../../types";
import { AlertsList } from "./alert.list";

export async function AlertListPage(
	{ db, authApi }: PageContext,
	req: Bun.BunRequest,
) {
	const url = new URL(req.url);

	const cursor = url.searchParams.get("cursor") ?? undefined;
	const search = url.searchParams.get("q") ?? undefined;

	const { rows, cursorNext } = db.alerts.findAlerts({
		owner: PUBLIC_OWNER,
		cursor,
		limit: 35,
		address: search,
	});

	const page = {
		rows: rows,
		cursorNext,
		cursorCurrent: cursor,
		filters: {
			q: search,
		},
	};

	if (req.headers.get("HX-Request")) {
		return render(<AlertsList ctx={{ url }} page={page} />);
	}

	const user = await authApi.getAuthenticatedUser(req);

	return render(
		<ConsoleApp member={user} path="/console/entities">
			<AlertsList ctx={{ url }} page={page} />
		</ConsoleApp>,
	);
}
