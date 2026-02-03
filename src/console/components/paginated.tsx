import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function Paginated({
	path,
	cursorNext,
	cursorCurrent,
	children,
}: {
	path: string;
	cursorNext?: string | null;
	cursorCurrent?: string | null;
	children: React.ReactNode;
}) {
	return (
		<section
			id="main-content"
			className="flex h-full flex-col"
			data-cursor-next={cursorNext ?? ""}
			data-cursor-current={cursorCurrent ?? ""}
		>
			{children}
			<div className="flex justify-end border-t border-zinc-800 bg-zinc-950 px-4 py-3 text-sm space-x-2">
				<button
					type="button"
					id="previous-button"
					className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-900"
					hx-on:click="history.back()"
					disabled={!cursorCurrent}
				>
					<ChevronLeftIcon /> <span>Previous</span>
				</button>

				<button
					type="button"
					id="next-button"
					className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-900"
					hx-get={`${path}?cursor=${cursorNext ?? ""}`}
					hx-target="#main-content"
					hx-swap="outerHTML"
					hx-push-url="true"
					disabled={!cursorNext}
				>
					<span>Next</span> <ChevronRightIcon />
				</button>
			</div>
		</section>
	);
}
