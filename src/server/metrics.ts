import {
	Counter,
	collectDefaultMetrics,
	Gauge,
	Histogram,
	Registry,
} from "prom-client";

export function createMetrics() {
	const register = new Registry();

	collectDefaultMetrics({ register });

	const alertsProcessed = new Counter({
		name: "hyperion_alerts_processed_total",
		help: "Number of alerts processed by Hyperion",
		labelNames: ["id"],
	});

	const eventsReceived = new Counter({
		name: "hyperion_events_received_total",
		help: "Number of events received",
		labelNames: ["type"],
	});

	const rulesLoaded = new Gauge({
		name: "hyperion_rules_loaded",
		help: "Number of rule instances currently loaded",
	});

	const ruleEvalDuration = new Histogram({
		name: "hyperion_rule_eval_duration_seconds",
		help: "Duration of rule evaluation in seconds",
		buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
	});

	register.registerMetric(eventsReceived);
	register.registerMetric(rulesLoaded);
	register.registerMetric(alertsProcessed);
	register.registerMetric(ruleEvalDuration);

	return {
		register,
		alertsProcessed,
		eventsReceived,
		rulesLoaded,
		ruleEvalDuration,
	};
}

export type Metrics = ReturnType<typeof createMetrics>;
