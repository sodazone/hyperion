import type { Entity } from "@/db";
import { topLevelCategories } from "@/intel/mapping";
import { CopyButton } from "./components/btn.copy";
import { CategoryBadge } from "./components/category.badge";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronUpDownIcon,
	SearchIcon,
} from "./components/icons";
import { NetworkIconGroup } from "./components/network.icon.group";
import type { NetworkInfos } from "./extra.infos";

type EntityPage = {
	rows: Array<Entity & { networks: string[] }>;
	cursorNext?: string | null;
	cursorCurrent?: string | null;
	filters: {
		networkId?: string;
		category?: string;
		q?: string;
	};
};

type Props = {
	page: EntityPage;
	ctx: {
		networkInfos: NetworkInfos;
	};
};

export function EntitiesView({ page, ctx: { networkInfos } }: Props) {
	const { rows, cursorNext, filters, cursorCurrent } = page;

	return (
		<section
			id="entity-section"
			className="flex h-full flex-col"
			data-cursor-next={cursorNext ?? ""}
			data-cursor-current={cursorCurrent ?? ""}
		>
			{/* Filter Bar */}
			<form
				id="entity-filters-form"
				className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2"
				hx-get="/console/entities"
				hx-target="#entity-section"
				hx-swap="outerHTML"
				hx-trigger="change from:select, reset"
				hx-push-url="true"
			>
				{/* Search Input with Button inside */}
				<div className="relative w-80 mr-4">
					<button
						type="submit"
						className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-600 hover:text-zinc-100"
						aria-label="Search"
					>
						<SearchIcon />
					</button>
					<input
						type="text"
						name="q"
						defaultValue={filters.q}
						placeholder="Search address..."
						className="w-full pl-8 pr-3 py-2 text-sm bg-transparent
                  border-b border-zinc-800
                  text-zinc-100
                  placeholder-zinc-600
                  focus:border-zinc-300
                  focus:outline-none"
					/>
				</div>

				{/* Network Filter */}
				<div className="relative w-40">
					<select
						name="networkId"
						defaultValue={filters.networkId ?? "*"}
						className="
              w-full
              border
              border-zinc-900
              bg-zinc-950
              text-zinc-400
              text-sm
              px-3
              py-2
              rounded-md
              appearance-none
              hover:text-zinc-200
              hover:bg-zinc-900
              focus:outline-none
            "
					>
						<option value="*">All Networks</option>
						<option value="768">Ethereum</option>
						<option value="257">Polkadot Asset Hub</option>
						<option value="1280">Bitcoin</option>
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-600">
						<ChevronUpDownIcon />
					</div>
				</div>

				{/* Category Filter */}
				<div className="relative w-40">
					<select
						name="category"
						defaultValue={filters.category ?? "*"}
						className="
              w-full
              border
              border-zinc-900
              bg-zinc-950
              text-zinc-400
              text-sm
              px-3
              py-2
              appearance-none
              hover:text-zinc-200
              hover:bg-zinc-900
              focus:outline-none
            "
					>
						<option value="*">All Categories</option>
						{topLevelCategories.map(({ category, label }) => (
							<option key={category} value={category}>
								{label}
							</option>
						))}
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-600">
						<ChevronUpDownIcon />
					</div>
				</div>

				<input
					type="reset"
					value="Reset All"
					className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-200 ml-4"
					hx-on:click={`
              window.entityPageStack = [];

              const form = document.getElementById('entity-filters-form');
              if(form) {
                form.q.value = '';
                form.networkId.value = '*';
                form.category.value = '*';
              }

              htmx.trigger(form, 'reset');
            `}
				/>
			</form>

			{/* Table */}
			<div id="entity-table" className="flex-1 overflow-auto">
				<table className="w-full text-sm">
					<thead className="sticky top-0 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
						<tr>
							<th className="px-4 py-2 text-left">Address</th>
							<th className="px-4 py-2 text-left">Networks</th>
							<th className="px-4 py-2 text-left">Categories</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-800">
						{rows.map((e) => (
							<tr
								key={e.address_formatted}
								className="hover:bg-zinc-900 cursor-pointer"
								hx-get={`/console/entities/${e.address_formatted}`}
								hx-target="#main-panel"
								hx-push-url="true"
							>
								<td className="px-4 py-2 font-mono text-xs text-zinc-200">
									<div className="flex items-center gap-2">
										<span>{e.address_formatted}</span>
										<CopyButton
											text={e.address_formatted}
											title="Copy address"
										/>
									</div>
								</td>
								<td className="px-4 py-2 text-zinc-300">
									<NetworkIconGroup
										networkInfos={networkInfos}
										urns={e.networks}
									/>
								</td>
								<td className="px-4 py-2 text-zinc-300">
									{e.categories?.map(({ category }) => (
										<CategoryBadge key={category} categoryCode={category} />
									))}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="flex justify-end border-t border-zinc-800 bg-zinc-950 px-4 py-3 text-sm space-x-2">
				<button
					type="button"
					id="previous-button"
					className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-900"
				>
					<ChevronLeftIcon /> <span>Previous</span>
				</button>

				<button
					type="button"
					id="next-button"
					className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-900"
				>
					<span>Next</span> <ChevronRightIcon />
				</button>
			</div>

			{/* Client-side pagination logic */}
			<script>
				{`
          (function () {
            if (window.__entityPaginationInstalled) return;

            window.__entityPaginationInstalled = true;

            window.entityPageStack = window.entityPageStack || [];

            function getCurrentFilters(root) {
              const form = root.querySelector('form');
              const params = new URLSearchParams();
              if (!form) return params;

              const formData = new FormData(form);
              for (const [k, v] of formData.entries()) {
                if (v) params.set(k, v.toString());
              }
              return params;
            }

            function updateButtons(root) {
              const prevBtn = root.querySelector('#previous-button');
              const nextBtn = root.querySelector('#next-button');

              const cursorNext = root.dataset.cursorNext;

              if (prevBtn) {
                prevBtn.onclick = () => goBackward(root);
                prevBtn.disabled = window.entityPageStack.length <= 1;
              }

              if (nextBtn) {
                nextBtn.onclick = () => goForward(root);
                nextBtn.disabled = !cursorNext;
              }
            }

            function goForward(root) {
              const cursorNext = root.dataset.cursorNext;
              if (!cursorNext) return;

              window.entityPageStack.push(cursorNext);

              const params = getCurrentFilters(root);
              params.set('cursor', cursorNext);

              const url = '/console/entities?' + params.toString();

              htmx.ajax('GET', url, {
                target: '#entity-section',
                swap: 'outerHTML',
                push: url,
              });
            }

            function goBackward(root) {
              if (window.entityPageStack.length <= 1) return;

              window.entityPageStack.pop();

              const prevCursor =
                window.entityPageStack[window.entityPageStack.length - 1];

              const params = getCurrentFilters(root);
              params.set('cursor', prevCursor);

              const url = '/console/entities?' + params.toString();

              htmx.ajax('GET', url, {
                target: '#entity-section',
                swap: 'outerHTML',
                push: url
              });
            }

            function resetPagination(root) {
              window.entityPageStack = [];
              root.dataset.cursorCurrent = '';
              root.dataset.cursorNext = '';
            }

            htmx.onLoad((el) => {
              if (el.id !== 'entity-section') return;

              if (window.entityPageStack.length === 0) {
                window.entityPageStack.push(el.dataset.cursorCurrent ?? '');
              }

              updateButtons(el);

              const form = el.querySelector('form');
              if (form) {
                form.addEventListener('htmx:configRequest', () => {
                  resetPagination(el);
                  window.entityPageStack.push('');
                }, { once: true });
              }
            });

            document.body.addEventListener('htmx:historyRestore', (event) => {
              const section = document.getElementById('entity-section');
              if (section) updateButtons(section);
            }, { once: true });

            htmx.on('#entity-section', 'htmx:afterSwap', (event) => {
              updateButtons(event.target);
            });

            // initial state
            const section = document.getElementById('entity-section');
            if (window.entityPageStack.length === 0) {
              window.entityPageStack.push(section.dataset.cursorCurrent ?? '');
            }
            updateButtons(section);
          })();
            `}
			</script>
		</section>
	);
}
