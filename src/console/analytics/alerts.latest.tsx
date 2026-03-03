import { hashOwner } from "@/auth";
import { type OwnedAlert, PUBLIC_OWNER } from "@/db";
import { render } from "@/server/render";
import { equals } from "@/utils/bytes";
import { dateFormatter } from "@/utils/dates";
import { AlertMessage } from "../components/alert.message";
import { SeverityBadge } from "../components/badge.severity";
import { GlobeIcon } from "../components/icons";
import { NetworkGroup } from "../components/network.group";
import type { PageContext } from "../types";

const PublicBadge = (
	<span className="flex items-center text-xs gap-1 text-zinc-200">
		<GlobeIcon size={12} />
	</span>
);

function AlertSmallCard({ alert }: { alert: OwnedAlert }) {
	const isPublic = equals(alert.owner, PUBLIC_OWNER);
	return (
		<div
			key={alert.id}
			hx-get="/console/public/alerts"
			hx-target="#main-content"
			hx-push-url="true"
			className="
            flex flex-col gap-1
            text-sm
            max-w-full
            px-2
            py-2
            cursor-pointer
          "
		>
			<div className="flex justify-between items-baseline">
				<span className="text-xs text-zinc-500 tracking-wide font-mono">
					{dateFormatter.format(new Date(alert.timestamp))}
				</span>
				<div className="flex gap-2">
					{isPublic && PublicBadge}
					<SeverityBadge level={alert.level} />
				</div>
			</div>
			<AlertMessage parts={alert.message} />
			<div className="text-xs mt-1">
				<NetworkGroup networks={alert.networks} />
			</div>
		</div>
	);
}

export async function LatestAlertsFragment(
	ctx: PageContext,
	req: Bun.BunRequest<"/console/dashboard/fragments/latest-alerts">,
) {
	const owners = [PUBLIC_OWNER];
	const user = await ctx.authApi.getAuthenticatedUser(req);
	if (user) {
		owners.push(hashOwner(user.email));
	}

	const rows = ctx.db.alerting.alerts.getTopAlerts({
		owners,
		limit: 4,
	});

	if (rows.length === 0) {
		return render(<div>No alerts yet</div>);
	}

	return render(
		<div className="flex flex-col divide-y divide-zinc-900">
			{rows.map((r) => (
				<AlertSmallCard key={r.id} alert={r} />
			))}
		</div>,
	);
}
