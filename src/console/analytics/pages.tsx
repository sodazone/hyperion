import { render } from "@/server/render";
import { ConsoleApp } from "../app";
import type { PageContext } from "../types";
import { Dashboard } from "./dashboard";
import { parseDashboardParams } from "./params";

export function DashboardPage(_ctx: PageContext, req: Bun.BunRequest) {
	const { bucket, network } = parseDashboardParams(req);

	if (req.headers.get("HX-Request"))
		return render(<Dashboard bucket={bucket} network={network} />);

	return render(
		<ConsoleApp path="/console/dashboard">
			<Dashboard bucket={bucket} network={network} />
		</ConsoleApp>,
	);
}
