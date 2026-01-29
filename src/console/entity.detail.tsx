import type { AddressAnalysis, AddressAnalysisAllNetworks } from "@/intel/api";
import { NetworkMap } from "@/intel/mapping";
import { SplitBadge } from "./components/badge";
import { CopyButton } from "./components/btn.copy";
import { ChevronLeftIcon } from "./components/icons";
import { NetworkIcon } from "./components/network.icon";
import type { NetworkInfos } from "./extra.infos";

function EntityHeader({ address }: { address: string }) {
	return (
		<div className="flex flex-col gap-1 pb-4">
			<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
				Address
			</span>

			<div className="flex items-center gap-2">
				<span className="font-mono text-sm text-zinc-100">{address}</span>
				<CopyButton text={address} title="Copy address" />
			</div>
		</div>
	);
}

function NetworkSection({
	networkId,
	analysis,
	networkInfos,
}: {
	networkId: number;
	analysis: AddressAnalysis;
	networkInfos: NetworkInfos;
}) {
	return (
		<section className="space-y-6 rounded-lg border border-zinc-900 bg-zinc-950/60 p-5">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold text-zinc-200">
					<NetworkIcon
						urn={NetworkMap.toURN(networkId) ?? "unknown"}
						showName={true}
						networkInfos={networkInfos}
					/>
				</h2>

				<span className="text-xs text-zinc-500">Network ID {networkId}</span>
			</div>

			<div className="space-y-6">
				<CategoriesPanel attribution={analysis.attribution} />
				<TagsPanel tags={analysis.tags} />
				<SanctionsPanel {...analysis.sanctioned} />
				<RiskPanel risk={analysis.risk} />
			</div>
		</section>
	);
}

function SanctionsPanel({ sanctioned, lists }: AddressAnalysis["sanctioned"]) {
	if (!sanctioned) return null;

	return (
		<div>
			<h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
				Sanctions
			</h3>
			<ul className="list-inside text-sm text-zinc-300">
				{lists.map((l) => (
					<li key={l} className="flex gap-2">
						<span className="text-zinc-600">-</span>
						<span>{l}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
const levelMap: Record<string, { label: string; color: string; text: string }> =
	{
		critical: {
			label: "Critical Risk",
			color: "bg-red-500",
			text: "text-red-400",
		},
		medium: {
			label: "Medium Risk",
			color: "bg-yellow-400",
			text: "text-yellow-400",
		},
		low: {
			label: "Low Risk",
			color: "bg-green-400",
			text: "text-green-400",
		},
	} as const;

function RiskIndicator({
	level,
	score,
}: {
	level: AddressAnalysis["risk"]["level"];
	score: number;
}) {
	const cfg = levelMap[level];
	if (!cfg) return null;

	return (
		<div className="space-y-2">
			<div className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</div>

			<div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
				<div
					className={`h-full ${cfg.color}`}
					style={{ width: `${Math.min(score, 100)}%` }}
				/>
			</div>

			<div className="text-xs text-zinc-500">Risk score: {score}/100</div>
		</div>
	);
}

function RiskPanel({ risk }: { risk: AddressAnalysis["risk"] }) {
	return (
		<div>
			<h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
				Risk Assessment
			</h3>

			<div className="space-y-4 rounded-lg border border-zinc-900 bg-zinc-950/60 p-4">
				<RiskIndicator level={risk.level} score={risk.score} />

				{risk.reasons.length > 0 && (
					<ul className="list-inside space-y-1 text-xs text-zinc-400">
						{risk.reasons.map((reason) => (
							<li key={reason} className="flex gap-2">
								<span className="text-zinc-600">-</span>
								<span>{reason}</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

function CategoriesPanel({
	attribution,
}: {
	attribution: AddressAnalysis["attribution"];
}) {
	return (
		<div>
			<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
				Attribution
			</h3>

			<div className="flex flex-wrap gap-2">
				{attribution.map((a, i) => (
					<SplitBadge
						key={`${a.category.code}:${a.subcategory.code}:${i}`}
						left={a.category.label ?? a.category.code}
						right={a.subcategory.label ?? a.subcategory.code}
					/>
				))}
			</div>
		</div>
	);
}

function TagsPanel({ tags }: { tags: AddressAnalysis["tags"] }) {
	if (tags.length === 0) return null;

	return (
		<div>
			<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
				Tags
			</h3>

			<div className="flex flex-wrap gap-2">
				{tags.map(({ tag }) => (
					<SplitBadge key={tag.code} left={tag.type} right={tag.name} />
				))}
			</div>
		</div>
	);
}

function BackButton() {
	return (
		<a
			href="/console/entities"
			hx-on="click: history.back()"
			className="inline-flex items-center gap-1  text-zinc-400 hover:text-zinc-200"
		>
			<ChevronLeftIcon /> <span>Back</span>
		</a>
	);
}

type Props = {
	entity: AddressAnalysisAllNetworks;
	ctx: {
		networkInfos: NetworkInfos;
	};
};

export function EntityDetailsView({ entity, ctx: { networkInfos } }: Props) {
	return (
		<section className="h-full overflow-auto bg-zinc-950 p-6 space-y-8">
			<BackButton />
			<EntityHeader address={entity.address} />

			<div className="space-y-8">
				{entity.networks.map((n) => (
					<NetworkSection
						key={n.networkId}
						networkId={n.networkId}
						analysis={n.analysis}
						networkInfos={networkInfos}
					/>
				))}
			</div>
		</section>
	);
}
