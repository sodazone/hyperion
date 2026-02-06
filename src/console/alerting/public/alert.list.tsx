import { SeverityBadge } from "@/console/components/badge.severity";
import { NetworkIcon } from "@/console/components/network.icon";
import { Paginated } from "@/console/components/paginated";
import { SearchFilters } from "@/console/components/search.filters";
import { TopBar } from "@/console/components/top.bar";
import { withCursor } from "@/console/util";
import type { Alert, AlertActor } from "@/db/model";
import { NetworkMap } from "@/intel/mapping";

type AlertPage = {
	rows: Alert[];
	cursorNext?: string | null;
	cursorCurrent?: string | null;
	filters: {
		networkId?: string;
		ruleId?: string;
		levelMin?: number;
		levelMax?: number;
		q?: string;
	};
};

type Props = {
	page: AlertPage;
	ctx: {
		url: URL;
	};
};

function AlertCards({ rows }: { rows: Alert[] }) {
	if (!rows.length) {
		return (
			<p className="text-zinc-500 text-center py-12 text-sm">No alerts found</p>
		);
	}

	return (
		<div className="space-y-5">
			{rows.map((alert) => {
				const actors = alert.payload?.actors ?? [];

				return (
					<div
						key={alert.id}
						className="
            flex flex-col gap-2
              rounded-md
              bg-zinc-900/90
              border border-zinc-800
              p-5
              shadow-sm
              hover:bg-zinc-900
              transition-colors
            "
					>
						<div className="flex items-start justify-between">
							<span className="text-xs text-zinc-500 tracking-wide font-mono">
								{new Date(alert.timestamp).toLocaleString()}
							</span>

							<SeverityBadge level={alert.level} />
						</div>

						<p className=" text-zinc-100 my-4">{alert.message}</p>

						{actors.length > 0 && (
							<div className="space-y-1 text-sm">
								{actors.map((a: AlertActor) => (
									<div key={a.role} className="flex gap-2 text-zinc-300">
										<span className="text-zinc-500 w-14 capitalize">
											{a.role}
										</span>

										<span className="font-mono text-xs">
											{a.address_formatted}
										</span>

										{a.labels && a.labels.length > 0 && (
											<span className="text-zinc-500 text-xs">
												{a.labels?.join(", ")}
											</span>
										)}
									</div>
								))}
								{alert.remark && (
									<div className="flex gap-2 text-zinc-300">
										<span className="text-zinc-500 w-14 capitalize">
											Remark
										</span>
										<span>{alert.remark}</span>
									</div>
								)}
							</div>
						)}

						<div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 mt-2">
							{alert.network && (
								<NetworkIcon
									urn={NetworkMap.toURN(alert.network) ?? "unknown"}
									size={20}
									showName
								/>
							)}

							{alert.block_hash && (
								<span className="font-mono">
									block #{alert.block_number} {alert.block_hash.slice(0, 8)}
								</span>
							)}
							{alert.tx_hash && (
								<span className="font-mono">
									tx {alert.tx_hash.slice(0, 8)}...
								</span>
							)}
						</div>

						<div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-600">
							{alert.rule_id}
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function AlertsList({ page, ctx: { url } }: Props) {
	const { rows, cursorNext, cursorCurrent, filters } = page;
	const nextUrl = withCursor(url, cursorNext);
	const path = "/console/alerts";

	return (
		<Paginated
			nextUrl={nextUrl}
			hasNext={!!cursorNext}
			hasPrev={!!cursorCurrent}
		>
			<TopBar left={<h1 className="text-lg font-semibold">Alerts</h1>} />
			<SearchFilters path={path} filters={filters} />
			<AlertCards rows={rows} />
		</Paginated>
	);
}
