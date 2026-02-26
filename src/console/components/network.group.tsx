import { NetworkMap } from "@/intel/mapping";
import { ArrowRightStroke } from "./icons";
import { NetworkIcon } from "./network.icon";

export function NetworkGroup({
	networks,
}: {
	networks?: { network: number }[];
}) {
	if (networks && networks.length > 0) {
		return (
			<div className="flex items-center gap-2">
				{networks.length === 1 ? (
					<NetworkIcon
						urn={
							networks[0]?.network
								? NetworkMap.toURN(networks[0].network)
								: "unknown"
						}
						size={16}
						showName
					/>
				) : (
					<>
						<NetworkIcon
							urn={
								networks[0]?.network
									? NetworkMap.toURN(networks[0].network)
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
								networks[networks.length - 1]?.network
									? NetworkMap.toURN(
											networks[networks?.length - 1]?.network ?? 0,
										)
									: "unknown"
							}
							size={16}
							showName
						/>
					</>
				)}
			</div>
		);
	} else {
		return null;
	}
}
