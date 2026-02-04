import { NetworkIcon } from "./network.icon";

type NetworkIconGroupProps = {
	urns: Array<string | undefined>;
	max?: number;
	size?: number;
};

export function NetworkIconGroup({
	urns,
	max = 3,
	size = 18,
}: NetworkIconGroupProps) {
	const visible = urns.slice(0, max);
	const extra = urns.length - visible.length;

	return (
		<span className="inline-flex items-center">
			<span className="flex -space-x-1.5">
				{visible.map((urn) => (
					<span
						key={urn}
						className="flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-950 p-1"
					>
						<NetworkIcon urn={urn} size={size} />
					</span>
				))}
			</span>

			{extra > 0 && (
				<span className="ml-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-zinc-800 px-1 text-[10px] font-medium text-zinc-300">
					+{extra}
				</span>
			)}
		</span>
	);
}
