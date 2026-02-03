type Props = {
	left?: React.ReactNode;
	right?: React.ReactNode;
};

export function TopBar({ left, right }: Props) {
	return (
		<div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-2 h-18">
			{left && <div className="flex items-center gap-2">{left}</div>}
			{right && <div className="flex items-center gap-2">{right}</div>}
		</div>
	);
}
