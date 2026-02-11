import type { RuleInstance } from "@/alerting";
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
		<label className="inline-flex items-center cursor-pointer select-none relative">
			<input
				type="checkbox"
				defaultChecked={enabled}
				name="enabled"
				className="sr-only peer"
				hx-put={`/console/rules/${id}`}
				hx-trigger="change"
				hx-include="this"
				hx-target="closest .card"
				hx-swap="outerHTML"
				hx-on--before-request={`
          if(!this.checked && !confirm('Disable this rule? This will stop current processing.')) {
            event.preventDefault();
            this.checked = true; /* revert UI */
          }
        `}
			/>

			<div
				className="
        w-9 h-5 rounded-full
        bg-zinc-800
        ring-1 ring-zinc-700/70
        shadow-inner
        peer-checked:bg-emerald-500
        transition-colors
      "
			/>

			<span
				className="
        absolute top-0.5 left-0.5
        w-4 h-4 rounded-full
        bg-white
        shadow-sm
        transition-all duration-150 ease-out
        peer-checked:left-4.5
      "
			/>
		</label>
	);
}

export function RuleCard({ rule }: { rule: RuleInstance }) {
	return (
		<div key={rule.id} className="p-3 group transition card">
			<div className="flex items-center gap-4 text-sm">
				<ToggleControl id={rule.id} enabled={rule.enabled} />

				<div className="flex gap-2 flex-wrap">
					<span className="text-zinc-300">{rule.title}</span>
					<span className="font-mono text-zinc-500">{rule.ruleKey}</span>
				</div>

				<PrettyConfig config={rule.config} />

				<div className="flex-1" />

				<div className="flex gap-3 md:opacity-0 md:group-hover:opacity-100 md:transition text-xs">
					<button
						type="button"
						hx-delete={`/console/rules/${rule.id}`}
						hx-target="closest div.card"
						hx-swap="outerHTML"
						hx-confirm="Delete this rule?"
						className="text-red-400 hover:text-red-300"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
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
				<RuleCard key={r.id} rule={r} />
			))}
		</div>
	);
}

export function RulesList({ page, ctx: { url } }: Props) {
	const { rows, cursorNext, cursorCurrent } = page;
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
						hx-swap="innerHTML swap:80ms"
						className="ui-btn"
					>
						<PlusIcon size={18} />
						<span>Add Rule</span>
					</button>
				}
				left={<h1 className="text-lg font-semibold">Rules</h1>}
			/>

			<RuleCards rows={rows} />
		</Paginated>
	);
}
