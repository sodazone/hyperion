import { ArrowUpRight } from "../components/icons";
import { RichSelect } from "../components/select";
import { TopBar } from "../components/top.bar";
import { type BucketString, NETWORK_OPTIONS } from "./params";

export function Dashboard({
	network = "urn:ocn:polkadot:1000",
	bucket = "hour",
}: {
	network?: string;
	bucket?: BucketString;
}) {
	return (
		<section
			id="dashboard-container"
			x-data={`dashboard('${network}', '${bucket}')`}
			x-init="init()"
			className="flex flex-col min-h-0 max-w-full md:w-5xl lg:w-6xl md:mx-auto space-y-4"
		>
			<TopBar
				left={<h1 className="text-lg font-semibold">Ecosystem Overview</h1>}
			/>

			{/* Filters */}
			<form
				id="dashboard-filters"
				className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6 p-2"
			>
				<div className="flex flex-wrap gap-2 w-full justify-between items-center">
					<div className="relative w-56" x-ref="networkSelect">
						<RichSelect
							name="network"
							selected={network}
							options={NETWORK_OPTIONS}
						/>
					</div>

					<div className="inline-flex h-fit rounded-base shadow-xs -space-x-px text-zinc-400">
						<button
							type="button"
							x-on:click="setBucket('hour')"
							x-bind:class="{'bg-zinc-900 text-zinc-100 font-semibold': bucket==='hour'}"
							className="px-3 py-1 rounded-s-sm border border-zinc-800 text-xs font-semibold hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
						>
							24h
						</button>
						<button
							type="button"
							x-on:click="setBucket('day')"
							x-bind:class="{'bg-zinc-900 text-zinc-100 font-semibold': bucket==='day'}"
							className="px-3 py-1 rounded-e-sm border border-zinc-800 text-xs font-semibold hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
						>
							30D
						</button>
					</div>
				</div>

				<input type="hidden" name="bucket" x-bind:value="bucket" />
				<input type="hidden" name="network" x-bind:value="network" />
			</form>

			{/* Charts */}
			<div className="flex flex-col lg:flex-row space-y-4 lg:divide-x lg:divide-zinc-900">
				<div className="flex flex-col flex-1 p-4 space-y-2">
					<h3 className="text-zinc-200 text-sm font-semibold">
						Exchange Flows (USD)
					</h3>

					<div className="flex py-1 font-mono divide-x divide-zinc-900 mb-6">
						<div className="pr-6">
							<div className="text-xs text-zinc-500">Volume</div>
							<div
								id="kpi-volume"
								className="text-sm font-semibold text-zinc-100"
							>
								<span className="text-zinc-600">–</span>
							</div>
						</div>

						<div className="px-6">
							<div className="text-xs text-zinc-500">Net Flow</div>
							<div id="kpi-net" className="text-sm font-semibold text-zinc-100">
								<span className="text-zinc-600">–</span>
							</div>
						</div>

						<div className="pl-6">
							<div className="text-xs text-zinc-500">Z-Score</div>
							<div
								id="kpi-zscore"
								className="text-sm font-semibold text-zinc-100"
							>
								<span className="text-zinc-600">–</span>
							</div>
						</div>
					</div>

					<canvas x-ref="cexCanvas" className="w-full max-h-80"></canvas>
				</div>

				<div className="flex-1 p-4 flex flex-col space-y-4">
					<h3 className="text-zinc-200 text-sm font-semibold">Top Exchanges</h3>

					<div
						x-ref="topExchanges"
						hx-get="/console/dashboard/fragments/top-exchanges"
						hx-trigger="load, refresh"
						hx-target="this"
						hx-include="#dashboard-filters"
						className="flex-1 overflow-x-auto"
					></div>
				</div>
			</div>

			<div className="flex flex-col p-4 space-y-4">
				<h3 className="text-zinc-200 text-sm font-semibold">
					<a
						href="/console/public/alerts"
						hx-get="/console/public/alerts"
						hx-target="#main-content"
						hx-push-url="true"
						className="flex gap-1 items-center hover:text-zinc-100"
					>
						<span>Latest Alerts</span>{" "}
						<span className="text-zinc-500">
							<ArrowUpRight size={20} />
						</span>
					</a>
				</h3>
				<div
					hx-get="/console/dashboard/fragments/latest-alerts"
					hx-trigger="load"
					hx-target="this"
				></div>
			</div>
		</section>
	);
}
