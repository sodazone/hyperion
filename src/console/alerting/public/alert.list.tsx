import { SeverityBadge } from "@/console/components/badge.severity";
import { CopyButton } from "@/console/components/btn.copy";
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
              flex flex-col gap-3
              rounded-lg
              bg-zinc-900/90
              border border-zinc-800
              p-5
              shadow-md
              hover:bg-zinc-900
              transition-colors
            "
					>
						<div className="flex justify-between items-start">
							<span className="text-xs text-zinc-500 tracking-wide font-mono">
								{new Date(alert.timestamp).toLocaleString()}
							</span>
							<SeverityBadge level={alert.level} />
						</div>

						<div className="text-zinc-100 text-base font-semibold leading-snug">
							{alert.message}
						</div>

						{actors.length > 0 && (
							<div className="gap-1.5 text-sm mt-2 text-zinc-400">
								{actors.map((a: AlertActor) => (
									<div key={a.role} className="flex items-center gap-2">
										<span className="text-zinc-500 w-16 capitalize">
											{a.role}
										</span>
										<span className="flex gap-1 items-center font-mono">
											{a.address_formatted}
											<CopyButton
												title="Copy Address"
												text={a.address_formatted}
											/>
										</span>
										{a.labels && a.labels.length > 0 && (
											<span className="text-zinc-500 text-xs">
												{a.labels.join(", ")}
											</span>
										)}
									</div>
								))}
								{alert.remark && (
									<div className="flex gap-2">
										<span className="text-zinc-500 w-16 capitalize">
											Remark
										</span>
										<span>{alert.remark}</span>
									</div>
								)}
							</div>
						)}

						<div className="flex flex-col gap-1.5 mt-3 text-sm text-zinc-400">
							{alert.network && (
								<div className="flex gap-2">
									<span className="text-zinc-500 w-16 capitalize">Network</span>
									<NetworkIcon
										urn={NetworkMap.toURN(alert.network) ?? "unknown"}
										size={18}
										showName
									/>
								</div>
							)}
							{alert.block_hash && (
								<div className="flex gap-2">
									<span className="text-zinc-500 w-16 capitalize">Block</span>
									<span className="font-mono">{alert.block_hash}</span>
									<span className="text-xs text-zinc-500 font-mono">
										(#{alert.block_number})
									</span>
								</div>
							)}
							{alert.tx_hash && (
								<div className="flex gap-2">
									<span className="text-zinc-500 w-16 capitalize">Tx</span>
									<span className="font-mono">{alert.tx_hash}</span>
								</div>
							)}
						</div>

						<div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
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
