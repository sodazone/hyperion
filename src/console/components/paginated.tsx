import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function Paginated({
	nextUrl,
	hasNext,
	hasPrev,
	children,
}: {
	nextUrl?: string;
	hasPrev: boolean;
	hasNext: boolean;
	children: React.ReactNode;
}) {
	return (
		<section className="flex h-full flex-col space-y-8">
			{children}

			<div className="flex justify-end border-t border-zinc-800 bg-zinc-950 px-4 py-3 text-sm space-x-2">
				<button
					type="button"
					hx-on:click="history.back()"
					disabled={!hasPrev}
					className="rounded-md border border-zinc-800 px-3 py-1.5 hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent flex gap-2"
				>
					<ChevronLeftIcon /> <span>Previous</span>
				</button>

				<button
					type="button"
					hx-get={nextUrl}
					hx-target="#main-content"
					hx-push-url="true"
					disabled={!hasNext}
					className="rounded-md border border-zinc-800 px-3 py-1.5 hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent flex gap-2"
				>
					<span>Next</span> <ChevronRightIcon />
				</button>
			</div>
		</section>
	);
}
