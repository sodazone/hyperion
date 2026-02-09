import type { RuleInstance } from "@/alerting";
import { RuleSearchFilters } from "@/console/components/alert.rule.filters";
import { PlusIcon } from "@/console/components/icons";
import { Paginated } from "@/console/components/paginated";
import { TopBar } from "@/console/components/top.bar";
import { withCursor } from "@/console/util";

type RulePage = {
	rows: RuleInstance[];
	cursorNext?: string | null;
	cursorCurrent?: string | null;
	filters: {
		q?: string;
		enabled?: string;
	};
};

type Props = {
	page: RulePage;
	ctx: { url: URL };
};

function PrettyConfig({ config }: { config: any }) {
	if (!config || !Object.keys(config).length) return null;

	const entries = Object.entries(config);

	return (
		<details className="text-xs text-zinc-400">
			<summary className="cursor-pointer hover:text-zinc-200 flex gap-2 flex-wrap">
				{entries.slice(0, 3).map(([k, v]) => (
					<span key={k} className="bg-zinc-800 px-2 py-0.5 rounded">
						{k}: {String(v)}
					</span>
				))}
				{entries.length > 3 && (
					<span className="text-zinc-500">+{entries.length - 3} more</span>
				)}
			</summary>

			<pre className="mt-2 bg-zinc-950/80 p-3 rounded font-mono text-[11px] overflow-x-auto">
				{JSON.stringify(config, null, 2)}
			</pre>
		</details>
	);
}

function ToggleControl({
	id,
	enabled,
}: {
	id: string | number;
	enabled: boolean;
}) {
	return (
		<label className="inline-flex items-center cursor-pointer select-none">
			<input
				type="checkbox"
				name="enabled"
				value="true"
				defaultChecked={enabled}
				className="sr-only peer"
				hx-post={`/console/rules/${id}/toggle`}
				hx-trigger="change"
				hx-target="closest div"
				hx-swap="outerHTML"
			/>

			{/* switch UI */}
			<div
				className="
          w-10 h-5 rounded-full bg-zinc-700
          peer-checked:bg-emerald-600
          relative transition
        "
			>
				<span
					className="
            absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition
            peer-checked:translate-x-5
          "
				/>
			</div>
		</label>
	);
}

export function RuleCards({ rows }: { rows: RuleInstance[] }) {
	if (!rows.length) {
		return (
			<p className="text-zinc-500 text-center py-12 text-sm">
				No alert rules created yet.
			</p>
		);
	}

	return (
		<div className="divide-y divide-zinc-900">
			{rows.map((r) => (
				<div key={r.id} className="p-3 group transition">
					<div className="flex items-center gap-4 text-sm">
						<ToggleControl id={r.id} enabled={r.enabled} />

						<span className="font-mono text-zinc-300 min-w-48">
							{r.ruleKey}
						</span>

						<PrettyConfig config={r.config} />

						<div className="flex-1" />

						{/* actions */}
						<div className="flex gap-3 md:opacity-0 md:group-hover:opacity-100 md:transition text-xs">
							<button
								type="button"
								hx-delete={`/console/rules/${r.id}`}
								hx-target="closest div"
								hx-swap="outerHTML"
								hx-confirm="Delete this rule?"
								className="text-red-400 hover:text-red-300"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

export function RulesList({ page, ctx: { url } }: Props) {
	const { rows, cursorNext, cursorCurrent, filters } = page;
	const nextUrl = withCursor(url, cursorNext);

	return (
		<Paginated
			nextUrl={nextUrl}
			hasNext={!!cursorNext}
			hasPrev={!!cursorCurrent}
		>
			<TopBar
				right={
					<button
						type="button"
						hx-get="/console/rules/form/__new__"
						hx-target="#main-content"
						hx-push-url="true"
						className="ui-btn"
					>
						<PlusIcon size={18} />
						<span>Add Rule</span>
					</button>
				}
				left={<h1 className="text-lg font-semibold">Rules</h1>}
			/>

			<RuleSearchFilters path="/console/rules" filters={filters} />

			<RuleCards rows={rows} />
		</Paginated>
	);
}
