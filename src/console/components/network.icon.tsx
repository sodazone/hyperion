import { NetworkCache } from "@/console/network.cache";

type NetworkIconProps = {
	urn?: string;
	showName?: boolean;
	size?: number;
};

export function NetworkIcon({
	urn,
	showName = false,
	size = 16,
}: NetworkIconProps) {
	if (!urn) return null;

	const net = NetworkCache.fromURN(urn);

	const label = net?.name ?? urn;
	const icon = net?.icon;

	return (
		<span className="inline-flex items-center gap-1.5">
			{icon ? (
				<img
					className="rounded-full"
					src={icon}
					alt={label}
					width={size}
					height={size}
					loading="lazy"
				/>
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
