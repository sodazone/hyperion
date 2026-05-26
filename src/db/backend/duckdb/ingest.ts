import type { AnyEvent } from "@/alerting";
import type { EntitiesDB } from "../sqlite/entities.db";
import type { AnalyticsDB } from "./db";

export function createAnalyticsIngestionPipeline({
	analytics,
	entities,
}: {
	analytics: AnalyticsDB;
	entities: EntitiesDB;
}) {
	const ctx = { entities };
	return {
		onEvent: (event: AnyEvent) => {
			analytics.ingestEvent(event, ctx);
		},
	};
}
