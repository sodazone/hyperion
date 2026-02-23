import { type AnyEvent, type TransferEvent, TransferStatus } from "@/alerting";
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

		const fromEntity = classify(from.address);
		const toEntity = classify(to.address);

		event.payload.from.categories = fromEntity?.categories?.map(
			(category) => category.category,
		);
		event.payload.from.tags = fromEntity?.tags?.map((tag) => tag.tag);
		event.payload.to.categories = toEntity?.categories?.map(
			(category) => category.category,
		);
		event.payload.to.tags = toEntity?.tags?.map((tag) => tag.tag);

		analytics.ingestTransfer(event);
	}

	return {
		onEvent: (event: AnyEvent) => {
			if (
				event.type === "transfer" &&
				event.payload.status === TransferStatus.SUCCESS
			) {
				onTransfer(event);
			}
		},
	};
}
