import type { CrosschainInvariantPayload } from "@/alerting/rules/templates/xc-invariant/rule";
import { NetworkIcon } from "../network.icon";

export function InvariantAlertDetails({ payload }: { payload: unknown }) {
	const p = payload as CrosschainInvariantPayload;
	return (
		<div className="flex flex-col gap-3 px-3 py-1.5 rounded-md bg-zinc-800/20">
			<div className="flex flex-col gap-2">
				<NetworkIcon urn={p.reserve.network} showName />
				<div className="flex gap-4 items-baseline">
					<span className="text-zinc-500 w-36">Reserve</span>
					<span className="flex gap-1 items-baseline">
						<span className="font-mono text-zinc-200 font-semibold">
							{p.reserve.balance.toFixed(6)}
						</span>
						<span className="text-zinc-500">{p.asset.symbol}</span>
					</span>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<NetworkIcon urn={p.remote.network} showName />
				<div className="flex gap-4 items-baseline">
					<span className="text-zinc-500 w-36">Remote</span>
					<span className="flex gap-1 items-baseline">
						<span className="font-mono text-zinc-200 font-semibold">
							{p.remote.balance.toFixed(6)}
						</span>
						<span className="text-zinc-500">{p.asset.symbol}</span>
					</span>
				</div>
			</div>
		</div>
	);
}
