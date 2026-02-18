import type { AnyEvent, TransferEvent } from "@/alerting";
import { PUBLIC_OWNER } from "../../db";
import type { EntitiesDB } from "../sqlite/entities.db";
import type { AnalyticsDB } from "./db";

export function createAnalyticsIngestionPipeline({
	analytics,
	entities,
}: {
	analytics: AnalyticsDB;
	entities: EntitiesDB;
}) {
	function classify(address: string) {
		const entity = entities.findEntity({
			owner: PUBLIC_OWNER,
			address,
		});
		return entity;
	}

	function onTransfer(event: TransferEvent) {
		const { from, to } = event.payload;

		const fromEntity = classify(from);
		const toEntity = classify(to);

		event.payload.fromCategories = fromEntity?.categories?.map(
			(category) => category.category,
		);
		event.payload.fromTags = fromEntity?.tags?.map((tag) => tag.tag);
		event.payload.toCategories = toEntity?.categories?.map(
			(category) => category.category,
		);
		event.payload.toTags = toEntity?.tags?.map((tag) => tag.tag);

		analytics.ingestTransfer(event);
	}

	return {
		onEvent: (event: AnyEvent) => {
			if (event.type === "transfer") {
				onTransfer(event);
			}
		},
	};
}
