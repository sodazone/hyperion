import { PUBLIC_OWNER } from "@/db";
import { render } from "@/server/render";
import { ConsoleApp } from "../../app";
import type { PageContext } from "../../types";
import { fetchAlertPage } from "../common/alert.fetch";
import { PublicAlertsList } from "./alert.list";

export async function AlertListPage(
	{ db, authApi }: PageContext,
	req: Bun.BunRequest,
) {
	const url = new URL(req.url);
	const page = fetchAlertPage(db, url, PUBLIC_OWNER);

	if (req.headers.get("HX-Request")) {
		return render(<PublicAlertsList ctx={{ url }} page={page} />);
	}

	const user = await authApi.getAuthenticatedUser(req);

	return render(
		<ConsoleApp member={user} path="/console/alerts">
			<PublicAlertsList ctx={{ url }} page={page} />
		</ConsoleApp>,
	);
}
