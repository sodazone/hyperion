import type { RuleInstance } from "@/alerting";
import { EnabledBadge } from "@/console/components/badge.enabled";
import { ChevronRightIcon, PlusIcon } from "@/console/components/icons";
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

export function RuleCard({ rule }: { rule: RuleInstance }) {
	return (
		<div
			key={rule.id}
			hx-get={`/console/rules/form/${rule.id}`}
			hx-target="#main-content"
			hx-push-url="true"
			className={`
group cursor-pointer
bg-zinc-950/40
hover:bg-teal-900/10
transition-colors
px-4 py-3
flex items-center justify-between
`}
		>
			<div className="flex flex-col">
				<div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
					{rule.title}
				</div>

				<div className="text-xs text-zinc-500 flex items-center gap-2">
					<span className="uppercase tracking-wide">{rule.ruleKey}</span>
					<EnabledBadge enabled={rule.enabled} />
				</div>
			</div>
			<div className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-sm">
				<ChevronRightIcon size={24} />
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
