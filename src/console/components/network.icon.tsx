import type { NetworkInfos } from "../extra.infos";

type NetworkIconProps = {
	urn?: string;
	name?: string;
	showName?: boolean;
	size?: number;
	networkInfos: NetworkInfos;
};

export function NetworkIcon({
	urn,
	showName = false,
	size = 16,
	networkInfos,
}: NetworkIconProps) {
	if (urn === undefined) return null;

	const { resolveNetworkIcon, resolveNetworkName } = networkInfos;

	const icon = resolveNetworkIcon(urn);
	const label = resolveNetworkName(urn) ?? urn;

	return (
		<span className="inline-flex items-center gap-1.5">
			{icon ? (
				<img src={icon} alt={label} width={size} height={size} loading="lazy" />
			) : (
				<span
					className="flex items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-400"
					style={{ width: size, height: size }}
				>
					{label[0]}
				</span>
			)}

			{showName && <span className="text-xs text-zinc-300">{label}</span>}
		</span>
	);
}
