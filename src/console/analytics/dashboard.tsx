import { RichSelect, RichSelectScript } from "../components/select";
import { TopBar } from "../components/top.bar";

export type BucketString = "hour" | "day";
export const BUCKETS = ["hour", "day"];

const NETWORK_OPTIONS = [
	{
		label: "Polkadot",
		value: "urn:ocn:polkadot:1000",
		icon: "https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata/v2/polkadot/0/icon.svg",
	},
	{
		label: "Hydration",
		value: "urn:ocn:polkadot:2034",
		icon: "https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata/v2/polkadot/2034/icon.svg",
	},
	{
		label: "Moonbeam",
		value: "urn:ocn:polkadot:2004",
		icon: "https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata/v2/polkadot/2004/icon.svg",
	},
];
export const NETWORKS = NETWORK_OPTIONS.map((opt) => opt.value);

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
			className="flex flex-col min-h-0 max-w-full md:w-5xl lg:w-6xl md:mx-auto space-y-4"
		>
			<TopBar
				left={<h1 className="text-lg font-semibold">Ecosystem Overview</h1>}
			/>

			{/* Filters Bar */}
			<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6 p-2">
				<div className="flex flex-wrap gap-2">
					<div className="relative w-56">
						<RichSelect
							name="network"
							selected={network}
							options={NETWORK_OPTIONS}
						/>
					</div>
					<div className="inline-flex rounded-base shadow-xs -space-x-px text-zinc-400">
						{["hour", "day"].map((b, index) => (
							<button
								key={b}
								type="button"
								data-bucket={b}
								className={`px-3 py-1 ${index === 0 ? "rounded-s-sm" : ""} ${index === 1 ? "rounded-e-sm" : ""} border border-zinc-800 text-xs font-semibold hover:bg-zinc-900 hover:text-zinc-100 transition-colors`}
							>
								{b === "hour" ? "24h" : "30D"}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex flex-col lg:flex-row gap-4">
				<div className="flex-1 p-4 max-h-80">
					<h3 className="text-zinc-300 text-sm font-semibold">
						Exchange Flows
					</h3>
					<canvas id="cex-flows-chart" className="w-full h-80"></canvas>
				</div>

				<div className="flex-1 p-4 flex flex-col gap-2">
					<h3 className="text-zinc-300 text-sm font-semibold">Top Exchanges</h3>
					<div
						id="top-exchanges-table"
						hx-get="/console/dashboard/fragments/top-exchanges"
						hx-trigger="load, refresh from:body"
						hx-target="#top-exchanges-table"
						hx-include="[name=network], [data-bucket].bg-zinc-900"
						className="flex-1 overflow-x-auto"
					></div>
				</div>
			</div>

			{/* Scripts */}
			<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
			<script>
				{`
      (function () {
        function initDashboard(container) {
          if (!container || container._dashboardInitialized) return;
          container._dashboardInitialized = true;

          const chartCanvas = container.querySelector('#cex-flows-chart');
          const bucketButtons = container.querySelectorAll('[data-bucket]');
          const networkInput = container.querySelector('input[name="network"]');
          const topExchangesEl = container.querySelector('#top-exchanges-table');

          if (!chartCanvas || !networkInput || !topExchangesEl) return;

          let currentBucket = "${bucket}";
          let chartInstance = null;

          function setActiveBucket(bucket) {
            bucketButtons.forEach(btn => {
              const active = btn.dataset.bucket === bucket;
              btn.classList.toggle('bg-zinc-900', active);
              btn.classList.toggle('text-zinc-100', active);
              btn.classList.toggle('font-semibold', active);
            });
          }

          function updateURL(bucket, network) {
            const url = new URL(window.location);
            url.searchParams.set('bucket', bucket);
            url.searchParams.set('network', network);
            window.history.replaceState({}, '', url);
          }

          function formatDate(ts, bucket) {
            const d = new Date(ts);
            return bucket === "hour"
              ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }

          function formatShortNumber(value) {
            if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
            if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
            if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1) + "K";
            return value.toString();
          }

          async function loadChart(bucket, network) {
            const params = new URLSearchParams({ bucket, network });
            const res = await fetch('/v1/analytics/cex_flows?' + params);
            const flows = await res.json();
            if (!Array.isArray(flows)) return;

            const labels = flows.map(f => formatDate(f.timestamp, bucket));
            const inflows = flows.map(f => f.inflow_usd || 0);
            const outflows = flows.map(f => -(f.outflow_usd || 0));
            const netFlows = flows.map(f => f.netflow_usd || 0);

            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(chartCanvas.getContext('2d'), {
              type: 'bar',
              data: {
                labels,
                datasets: [
                  {
                    type: 'line',
                    label: 'Net Flow',
                    data: netFlows,
                    borderColor: "#fff",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1.5,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                  },
                  {
                    type: "bar",
                    label: "Inflow",
                    data: inflows,
                    backgroundColor: "#89c0cc",
                    borderRadius: 2,
                    barPercentage: 0.9,
                    categoryPercentage: 0.9,
                  },
                  {
                    type: "bar",
                    label: "Outflow",
                    data: outflows,
                    backgroundColor: "#e45fac",
                    borderRadius: 2,
                    barPercentage: 0.9,
                    categoryPercentage: 0.9,
                  },
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { border: { display: false }, ticks: { maxTicksLimit: 6, color: 'rgba(255,255,255,0.8)' }, grid: { display: false } },
                  y: { border: { display: false }, ticks: { maxTicksLimit: 8, callback: (v) => formatShortNumber(v), color: 'rgba(255,255,255,0.8)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                },
                plugins: {
                  legend: { labels: { color: 'rgba(255,255,255,0.8)' } },
                  tooltip: { mode: 'index', intersect: false,
                    callbacks: { label: (ctx) => ctx.dataset.label + ': $' + formatShortNumber(ctx.raw) }
                  },
                },
              },
            });

            updateURL(bucket, network);
          }

          // Bucket click
          bucketButtons.forEach(btn => {
            btn.addEventListener('click', () => {
              currentBucket = btn.dataset.bucket;
              setActiveBucket(currentBucket);
              loadChart(currentBucket, networkInput.value);
              htmx.trigger(topExchangesEl, 'refresh'); // HTMX reload
            });
          });

          // Network change
          networkInput.addEventListener('change', () => {
            loadChart(currentBucket, networkInput.value);
            htmx.trigger(topExchangesEl, 'refresh'); // HTMX reload
          });

          // Init from URL
          const params = new URLSearchParams(window.location.search);
          currentBucket = params.get('bucket') || currentBucket;
          networkInput.value = params.get('network') || networkInput.value;

          setActiveBucket(currentBucket);
          loadChart(currentBucket, networkInput.value);
          htmx.trigger(topExchangesEl, 'refresh'); // initial HTMX load
        }

        document.addEventListener('DOMContentLoaded', () => {
          initDashboard(document.querySelector('#dashboard-container'));
        });

        document.body.addEventListener('htmx:afterSwap', (evt) => {
          const container = evt.detail.target.closest?.('#dashboard-container');
          if (container) initDashboard(container);
        });
      })();
      `}
			</script>

			<RichSelectScript />
		</section>
	);
}
