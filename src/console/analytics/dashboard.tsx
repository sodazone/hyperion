import { RichSelect, RichSelectScript } from "../components/select";
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
			className="flex flex-col min-h-0 max-w-full md:w-5xl lg:w-6xl md:mx-auto space-y-4"
		>
			<TopBar
				left={<h1 className="text-lg font-semibold">Ecosystem Overview</h1>}
			/>

			<form
				id="dashboard-filters"
				className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6 p-2"
			>
				<div className="flex flex-wrap gap-2 w-full justify-between items-center">
					<div className="relative w-56">
						<RichSelect
							name="network"
							selected={network}
							options={NETWORK_OPTIONS}
						/>
					</div>

					<div className="inline-flex h-fit rounded-base shadow-xs -space-x-px text-zinc-400">
						{["hour", "day"].map((b, index) => (
							<button
								key={b}
								type="button"
								data-bucket={b}
								className={`px-3 py-1 ${
									index === 0 ? "rounded-s-sm" : ""
								} ${index === 1 ? "rounded-e-sm" : ""}
                border border-zinc-800 text-xs font-semibold
                hover:bg-zinc-900 hover:text-zinc-100 transition-colors`}
							>
								{b === "hour" ? "24h" : "30D"}
							</button>
						))}
					</div>
				</div>

				<input type="hidden" name="bucket" value={bucket} />
			</form>

			<div className="flex flex-col lg:flex-row space-y-4 lg:divide-x lg:divide-zinc-900">
				<div className="flex flex-col flex-1 p-4 space-y-2">
					<h3 className="text-zinc-300 text-sm font-semibold">
						Exchange Flows (USD)
					</h3>
					<div className="flex py-1 font-mono divide-x divide-zinc-900">
						<div className="pr-6">
							<div className="text-xs text-zinc-500">Volume</div>
							<div
								id="kpi-volume"
								className="text-sm font-semibold text-zinc-300"
							>
								<span className="text-zinc-600">–</span>
							</div>
						</div>

						<div className="px-6">
							<div className="text-xs text-zinc-500">Net Flow</div>
							<div id="kpi-net" className="text-sm font-semibold text-zinc-300">
								<span className="text-zinc-600">–</span>
							</div>
						</div>

						<div className="pl-6">
							<div className="text-xs text-zinc-500">Z-Score</div>
							<div
								id="kpi-zscore"
								className="text-sm font-semibold text-zinc-300"
							>
								<span className="text-zinc-600">–</span>
							</div>
						</div>
					</div>
					<canvas id="cex-flows-chart" className="w-full max-h-80"></canvas>
				</div>

				<div className="flex-1 p-4 flex flex-col space-y-4">
					<h3 className="text-zinc-300 text-sm font-semibold">Top Exchanges</h3>

					<div
						id="top-exchanges-table"
						hx-get="/console/dashboard/fragments/top-exchanges"
						hx-trigger="load, refresh from:body"
						hx-target="#top-exchanges-table"
						hx-include="#dashboard-filters"
						className="flex-1 overflow-x-auto"
					></div>
				</div>
			</div>

			<div className="flex flex-col p-4 space-y-4">
				<h3 className="text-zinc-300 text-sm font-semibold">Latest Alerts</h3>
				<div>TBD</div>
			</div>

			<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
			<script>
				{`
(function () {

  function initDashboard(container) {
    if (!container || container._dashboardInitialized) return;
    container._dashboardInitialized = true;

    const form = container.querySelector('#dashboard-filters');
    const bucketInput = form.querySelector('input[name="bucket"]');
    const networkInput = form.querySelector('input[name="network"]');
    const bucketButtons = form.querySelectorAll('[data-bucket]');
    const chartCanvas = container.querySelector('#cex-flows-chart');
    const topExchangesEl = container.querySelector('#top-exchanges-table');

    if (!chartCanvas || !networkInput || !bucketInput) return;

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

    function calculateKPIs(flows) {
      if (!flows.length) return null;

      const inflows = flows.map(f => f.inflow_usd || 0);
      const outflows = flows.map(f => f.outflow_usd || 0);
      const netflows = flows.map(f => f.netflow_usd || 0);

      const totalVolume =
        inflows.reduce((a, v) => a + v, 0) +
        outflows.reduce((a, v) => a + v, 0);

      const totalNet = netflows.reduce((a, v) => a + v, 0);

      const sorted = [...netflows].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      const deviations = netflows.map(v => Math.abs(v - median));
      const sortedDev = deviations.sort((a, b) => a - b);
      const mad = sortedDev[Math.floor(sortedDev.length / 2)];

      const last = netflows[netflows.length - 1];

      const robustZ = mad === 0
        ? 0
        : (last - median) / (1.4826 * mad);

      return {
        totalVolume,
        totalNet,
        z: robustZ
      };
    }

    function renderKPIs(kpis) {
      if (!kpis) return;

      const volumeEl = document.getElementById('kpi-volume');
      const netEl = document.getElementById('kpi-net');
      const zEl = document.getElementById('kpi-zscore');

      volumeEl.textContent = formatShortNumber(kpis.totalVolume);
      netEl.textContent = formatShortNumber(kpis.totalNet);

      zEl.textContent = kpis.z.toFixed(2);

      zEl.classList.remove('text-pink-300', 'text-cyan-200', 'text-zinc-300');

      if (kpis.z > 2) {
        zEl.classList.add('text-cyan-200');
      } else if (kpis.z < -2) {
        zEl.classList.add('text-pink-300');
      } else {
        zEl.classList.add('text-zinc-300');
      }
    }

    function fillMissingPoints(flows, bucket) {
      if (!flows) return [];

      const filled = [];
      const now = new Date();
      const step = bucket === 'hour'
        ? 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

      const lookback = bucket === 'hour' ? 24 : 30;

      const flowMap = new Map();

      flows.forEach(f => {
        const ts = new Date(f.timestamp);
        let truncated;

        if (bucket === 'hour') {
          truncated = new Date(
            ts.getFullYear(),
            ts.getMonth(),
            ts.getDate(),
            ts.getHours()
          ).getTime();
        } else {
          truncated = new Date(
            ts.getFullYear(),
            ts.getMonth(),
            ts.getDate()
          ).getTime();
        }

        flowMap.set(truncated, f);
      });

      let lastCumulative = {
        cumulative_inflow_usd: 0,
        cumulative_outflow_usd: 0,
        cumulative_netflow_usd: 0,
      };

      for (let i = lookback - 1; i >= 0; i--) {
        let current = new Date(now.getTime() - i * step);

        if (bucket === 'hour') {
          current.setMinutes(0, 0, 0);
        } else {
          current.setHours(0, 0, 0, 0);
        }

        const key = current.getTime();

        if (flowMap.has(key)) {
          const f = flowMap.get(key);
          lastCumulative = {
            cumulative_inflow_usd: f.cumulative_inflow_usd ?? lastCumulative.cumulative_inflow_usd,
            cumulative_outflow_usd: f.cumulative_outflow_usd ?? lastCumulative.cumulative_outflow_usd,
            cumulative_netflow_usd: f.cumulative_netflow_usd ?? lastCumulative.cumulative_netflow_usd,
          };
          filled.push(f);
        } else {
          filled.push({
            timestamp: current,
            inflow_usd: 0,
            outflow_usd: 0,
            netflow_usd: 0,
            ...lastCumulative,
          });
        }
      }

      return filled;
    }

    async function loadChart(bucket, network) {
      const params = new URLSearchParams({ bucket, network });
      const res = await fetch('/v1/analytics/cex_flows?' + params);
      let flows = await res.json();
      if (!Array.isArray(flows)) return;

      flows = fillMissingPoints(flows, bucket);

      const kpis = calculateKPIs(flows);
      renderKPIs(kpis);

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
              borderColor: "rgba(255,255,255,0.7)",
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
            x: { border: { display: false }, ticks: { maxTicksLimit: 6, color: 'rgba(255,255,255,0.65)' }, grid: { display: false } },
            y: { border: { display: false }, ticks: { maxTicksLimit: 6, callback: (v) => formatShortNumber(v), color: 'rgba(255,255,255,0.65)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { mode: 'index', intersect: false,
              callbacks: { label: (ctx) => ctx.dataset.label + ': ' + formatShortNumber(ctx.raw) }
            },
          },
        },
      });

      updateURL(bucket, network);
    }

    // Bucket click
    bucketButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const bucket = btn.dataset.bucket;
        bucketInput.value = bucket;

        setActiveBucket(bucket);
        loadChart(bucket, networkInput.value);
        htmx.trigger(topExchangesEl, 'refresh');
      });
    });

    // Network change
    networkInput.addEventListener('change', () => {
      loadChart(bucketInput.value, networkInput.value);
      htmx.trigger(topExchangesEl, 'refresh');
    });

    // Init from URL
    const params = new URLSearchParams(window.location.search);
    const initialBucket = params.get('bucket') || bucketInput.value;
    const initialNetwork = params.get('network') || networkInput.value;

    bucketInput.value = initialBucket;
    networkInput.value = initialNetwork;

    setActiveBucket(initialBucket);
    loadChart(initialBucket, initialNetwork);
    htmx.trigger(topExchangesEl, 'refresh');
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
