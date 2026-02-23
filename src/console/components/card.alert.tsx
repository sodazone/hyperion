import type { Alert, AlertActor, AlertMessagePart } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import { dateFormatter } from "@/utils/dates";
import { resolveExchange } from "../analytics/cex.names";
import { trunc, truncMid } from "../util";
import { SeverityBadge } from "./badge.severity";
import { CopyButton } from "./btn.copy";
import { ArrowRightStroke } from "./icons";
import { NetworkIcon } from "./network.icon";
import { RuleIcons } from "./rule.icons";

function Part({ part: [type, value] }: { part: AlertMessagePart }) {
	switch (type) {
		case "t":
			return <span>{value}</span>;
		case "a":
			return (
				<span className="truncate font-mono font-semibold leading-none align-baseline">
					{value}
				</span>
			);
		case "addr":
			return (
				<span className="truncate font-mono font-semibold leading-none align-baseline">
					{truncMid(value)}
				</span>
			);
		case "cex": {
			const { icon, name } = resolveExchange(value);
			return (
				<span className="inline-flex items-baseline gap-1">
					{icon && (
						<img
							src={icon}
							alt={name}
							className="w-3 h-3 rounded-full align-baseline"
						/>
					)}
					<span className="truncate font-semibold">{name}</span>
				</span>
			);
		}
		case "e":
			return <span className="truncate font-semibold capitalize">{value}</span>;
		default:
			return <span className="text-zinc-400">{value}</span>;
	}
}

function renderMessage(parts: AlertMessagePart[]) {
	return (
		<div className="flex flex-wrap items-baseline gap-1 text-zinc-200">
			{parts.map((p) => (
				<Part key={p[0] + p[1]} part={p} />
			))}
		</div>
	);
}

function NetworkContext({ networks }: { networks?: Alert["networks"] }) {
	if (!networks || networks.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			{networks.map((n, i) => {
				const urn = n.network ? NetworkMap.toURN(n.network) : "unknown";

				return (
					<div
						key={`${n.role}-${i}`}
						className="flex flex-col gap-2 my-1 bg-zinc-800/20 rounded-sm p-1.5"
					>
						<div className="flex items-center gap-2 text-sm">
							<NetworkIcon urn={urn} size={16} showName />{" "}
						</div>

						<div className="flex flex-col gap-2">
							{n.block_hash && (
								<div className="flex items-center gap-2 text-sm">
									<span className="text-zinc-500 w-16">Block</span>
									<span className="font-mono truncate">
										{trunc(n.block_hash)}
									</span>
									<CopyButton title="Copy Block Hash" text={n.block_hash} />
									{n.block_number && (
										<span className="text-xs text-zinc-500 font-mono">
											(#{n.block_number})
										</span>
									)}
								</div>
							)}

							{n.tx_hash && (
								<div className="flex items-center gap-2 text-sm">
									<span className="text-zinc-500 w-16">Tx</span>
									<span className="font-mono truncate">{trunc(n.tx_hash)}</span>
									<CopyButton title="Copy Tx Hash" text={n.tx_hash} />
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function AlertCard({ alert }: { alert: Alert }) {
	const actors = alert.payload?.actors ?? [];
	return (
		<div
			key={alert.id}
			className="
            flex flex-col gap-3
            max-w-full
            md:rounded-lg
            bg-zinc-900/90
            px-3
            py-2
            shadow-md
            transition-colors
          "
		>
			<div className="flex justify-between items-start">
				<span className="text-xs text-zinc-500 tracking-wide font-mono">
					{dateFormatter.format(new Date(alert.timestamp))}
				</span>
				<SeverityBadge level={alert.level} />
			</div>

			<details>
				<summary className="text-sm leading-snug truncate">
					{renderMessage(alert.message)}
				</summary>

				<div className="flex flex-col gap-2 text-sm mt-2 text-zinc-400">
					{actors.length > 0 &&
						actors.map((a: AlertActor) => (
							<div key={a.role} className="flex items-center gap-2">
								<span className="text-zinc-500 w-16 capitalize">{a.role}</span>
								<span className="flex gap-1 items-center font-mono">
									<span className="truncate">
										{truncMid(a.address_formatted)}
									</span>
									<CopyButton title="Copy Address" text={a.address_formatted} />
								</span>
								{a.labels && a.labels.length > 0 && (
									<span className="text-zinc-500 text-xs truncate">
										{a.labels.join(", ")}
									</span>
								)}
							</div>
						))}
					<NetworkContext networks={alert.networks} />
					{alert.remark && (
						<div className="flex gap-2">
							<span className="text-zinc-500 w-16 capitalize">Remark</span>
							<span>{alert.remark}</span>
						</div>
					)}
				</div>
			</details>
			<div className="flex justify-between items-center text-xs">
				{alert.networks && alert.networks.length > 0 && (
					<div className="flex items-center gap-2">
						{alert.networks.length === 1 ? (
							<NetworkIcon
								urn={
									alert.networks[0]?.network
										? NetworkMap.toURN(alert.networks[0].network)
										: "unknown"
								}
								size={16}
								showName
							/>
						) : (
							<>
								<NetworkIcon
									urn={
										alert.networks[0]?.network
											? NetworkMap.toURN(alert.networks[0].network)
											: "unknown"
									}
									size={16}
									showName
								/>
								<span className="text-zinc-600 text-xs">
									<ArrowRightStroke size={14} />
								</span>
								<NetworkIcon
									urn={
										alert.networks[alert.networks.length - 1]?.network
											? NetworkMap.toURN(
													alert.networks[alert.networks?.length - 1]?.network ??
														0,
												)
											: "unknown"
									}
									size={16}
									showName
								/>
							</>
						)}
					</div>
				)}
				<div className="inline-flex items-center overflow-hidden text-xs leading-none gap-2">
					<span className="text-zinc-700 pr-4">#{alert.id}</span>
					<span className="w-4 h-4 text-zinc-700">{RuleIcons[alert.name]}</span>
					<span className="font-mono text-zinc-500">{alert.name}</span>
				</div>
			</div>
		</div>
	);
}

export function AlertCards({ rows }: { rows: Alert[] }) {
	if (!rows.length) {
		return (
			<p className="text-zinc-500 text-center py-12 text-sm">No alerts found</p>
		);
	}

	return (
		<div className="space-y-5">
			{rows.map((alert) => (
				<AlertCard key={alert.id} alert={alert} />
			))}
		</div>
	);
}
