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
		<section className="flex h-full flex-col mt-14 max-w-full md:max-w-4xl lg:max-w-5xl md:mx-auto">
			{children}

			<div className="flex justify-end border-t border-zinc-800 bg-zinc-950 px-4 py-3 text-sm space-x-2">
				<button
					type="button"
					hx-on:click="history.back()"
					disabled={!hasPrev}
					className="ui-btn"
				>
					<ChevronLeftIcon /> <span>Previous</span>
				</button>

				<button
					type="button"
					hx-get={nextUrl}
					hx-target="#main-content"
					hx-push-url="true"
					disabled={!hasNext}
					className="ui-btn"
				>
					<span>Next</span> <ChevronRightIcon />
				</button>
			</div>
		</section>
	);
}
