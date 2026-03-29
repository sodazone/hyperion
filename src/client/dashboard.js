import Chart from "chart.js/auto";

export function dashboard(initialNetwork, initialBucket) {
	return {
		bucket: initialBucket,
		network: initialNetwork,
		chartInstance: null,
		chartCanvas: null,
		loadChartInProgress: false,

		init() {
			this.$nextTick(() => {
				this.chartCanvas = this.$refs.cexCanvas;

				const networkSelect = this.$refs.networkSelect;
				const networkInput = networkSelect?.querySelector("input[type=hidden]");
				if (networkInput) {
					networkInput.addEventListener("change", (e) => {
						if (e.target.value !== this.network) {
							this.network = e.target.value;
						}
					});
				}
			});

			this.$watch(
				() => [this.bucket, this.network],
				() => {
					this.loadChart();
					htmx.trigger(this.$refs.topExchanges, "refresh");
					htmx.trigger(this.$refs.xcReserves, "refresh");
					this.updateURL();
				},
			);

			document.addEventListener("htmx:beforeSwap", (e) => {
				if (e.target.id === "dashboard-container" && this.chartInstance) {
					this.chartInstance.destroy();
					this.chartInstance = null;
				}
			});

			this.loadChart();
		},

		async loadChart() {
			await this.$nextTick();

			const canvas = this.$refs.cexCanvas;
			if (!canvas || !canvas.offsetWidth || !canvas.offsetHeight) {
				requestAnimationFrame(() => this.loadChart());
				return;
			}

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			if (this.loadChartInProgress) return;
			this.loadChartInProgress = true;

			try {
				const params = new URLSearchParams({
					bucket: this.bucket,
					network: this.network,
				});

				let flows = await fetch(`/v1/analytics/cex_flows?${params}`).then((r) =>
					r.json(),
				);

				if (!Array.isArray(flows)) flows = [];

				flows = this.fillMissingPoints(flows, this.bucket);

				const labels = flows.map((f) => this.formatLabelDate(f.timestamp));
				const inflows = flows.map((f) => f.inflow_usd || 0);
				const outflows = flows.map((f) => -(f.outflow_usd || 0));
				const netFlows = flows.map((f) => f.netflow_usd || 0);

				if (this.chartInstance) {
					this.chartInstance.destroy();
					this.chartInstance = null;
				}

				this.chartInstance = new Chart(ctx, {
					type: "bar",
					data: {
						labels,
						datasets: [
							{
								type: "line",
								label: "Net Flow",
								data: netFlows,
								borderColor: "rgba(255,255,255,0.7)",
								backgroundColor: "rgba(255,255,255,0.08)",
								borderWidth: 1.5,
								tension: 0.3,
								pointRadius: 0,
								pointHoverRadius: 4,
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
						],
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							x: {
								border: { display: false },
								ticks: { maxTicksLimit: 6, color: "rgba(255,255,255,0.65)" },
								grid: { display: false },
							},
							y: {
								border: { display: false },
								ticks: {
									maxTicksLimit: 6,
									callback: (v) => this.formatShortNumber(v),
									color: "rgba(255,255,255,0.65)",
								},
								grid: { color: "rgba(255,255,255,0.05)" },
							},
						},
						plugins: {
							legend: { position: "bottom" },
							tooltip: {
								mode: "index",
								intersect: false,
								callbacks: {
									label: (ctx) =>
										`${ctx.dataset.label}: ${this.formatShortNumber(ctx.raw)}`,
								},
							},
						},
					},
				});

				this.renderKPIs(flows);
			} finally {
				this.loadChartInProgress = false;
			}
		},

		setBucket(b) {
			this.bucket = b;
		},

		setNetwork(n) {
			this.network = n;
		},

		renderKPIs(flows) {
			const volEl = document.getElementById("kpi-volume");
			const netEl = document.getElementById("kpi-net");
			const zEl = document.getElementById("kpi-zscore");
			if (!flows.length) {
				volEl.textContent = netEl.textContent = zEl.textContent = "–";
				zEl.className = "text-zinc-200";
				return;
			}

			const inflows = flows.map((f) => f.inflow_usd || 0);
			const outflows = flows.map((f) => f.outflow_usd || 0);
			const netflows = flows.map((f) => f.netflow_usd || 0);
			const totalVolume =
				inflows.reduce((a, v) => a + v, 0) +
				outflows.reduce((a, v) => a + v, 0);
			const totalNet = netflows.reduce((a, v) => a + v, 0);
			const median = [...netflows].sort((a, b) => a - b)[
				Math.floor(netflows.length / 2)
			];
			const mad = [...netflows]
				.map((v) => Math.abs(v - median))
				.sort((a, b) => a - b)[Math.floor(netflows.length / 2)];
			const last = netflows[netflows.length - 1];
			const z = mad === 0 ? 0 : (last - median) / (1.4826 * mad);

			volEl.textContent = this.formatShortNumber(totalVolume);
			netEl.textContent = this.formatShortNumber(totalNet);
			zEl.textContent = z.toFixed(2);
			zEl.className =
				z > 2 ? "text-cyan-200" : z < -2 ? "text-pink-300" : "text-zinc-200";
		},

		formatShortNumber(v) {
			if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
			if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
			if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
			return v.toFixed(2);
		},

		formatLabelDate(ts) {
			const d = new Date(ts);

			if (this.bucket === "hour") {
				return d.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			if (this.bucket === "day") {
				return d.toLocaleDateString([], {
					month: "short",
					day: "numeric",
				});
			}

			return d.toLocaleString();
		},

		updateURL() {
			const url = new URL(window.location);
			url.searchParams.set("bucket", this.bucket);
			url.searchParams.set("network", this.network);
			window.history.replaceState({}, "", url);
		},

		fillMissingPoints(flows, bucket) {
			if (!Array.isArray(flows)) return [];

			const lookback = bucket === "hour" ? 24 : 30;
			const filled = [];
			const flowMap = new Map();

			flows.forEach((f) => {
				const ts = new Date(
					typeof f.timestamp === "string" && !f.timestamp.endsWith("Z")
						? `${f.timestamp}Z`
						: f.timestamp,
				);
				const key =
					bucket === "hour"
						? Date.UTC(
								ts.getUTCFullYear(),
								ts.getUTCMonth(),
								ts.getUTCDate(),
								ts.getUTCHours(),
							)
						: Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate());
				flowMap.set(key, f);
			});

			let start;
			if (bucket === "hour") {
				const nowUTC = new Date();
				start = new Date(
					Date.UTC(
						nowUTC.getUTCFullYear(),
						nowUTC.getUTCMonth(),
						nowUTC.getUTCDate(),
						nowUTC.getUTCHours() - (lookback - 1),
					),
				);
			} else {
				const nowUTC = new Date();
				start = new Date(
					Date.UTC(
						nowUTC.getUTCFullYear(),
						nowUTC.getUTCMonth(),
						nowUTC.getUTCDate() - (lookback - 1),
					),
				);
			}

			let lastCumulative = {
				cumulative_inflow_usd: 0,
				cumulative_outflow_usd: 0,
				cumulative_netflow_usd: 0,
			};

			for (let i = 0; i < lookback; i++) {
				const current = new Date(start);
				if (bucket === "hour") {
					current.setUTCHours(current.getUTCHours() + i);
				} else {
					current.setUTCDate(current.getUTCDate() + i);
				}

				const key =
					bucket === "hour"
						? Date.UTC(
								current.getUTCFullYear(),
								current.getUTCMonth(),
								current.getUTCDate(),
								current.getUTCHours(),
							)
						: Date.UTC(
								current.getUTCFullYear(),
								current.getUTCMonth(),
								current.getUTCDate(),
							);

				if (flowMap.has(key)) {
					const f = flowMap.get(key);
					lastCumulative = {
						cumulative_inflow_usd:
							f.cumulative_inflow_usd ?? lastCumulative.cumulative_inflow_usd,
						cumulative_outflow_usd:
							f.cumulative_outflow_usd ?? lastCumulative.cumulative_outflow_usd,
						cumulative_netflow_usd:
							f.cumulative_netflow_usd ?? lastCumulative.cumulative_netflow_usd,
					};
					filled.push({ ...f, timestamp: current });
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
		},
	};
}
