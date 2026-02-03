import type { Entity } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import type { EntityRow } from "./types";

export const enrichEntityRows = (rows: Entity[]): Array<EntityRow> => {
	return rows.map((e) => {
		const networksSet = new Set<number>();
		const categoriesSet = new Set<number>();
		const tagsSet = new Set<string>();

		e.categories?.forEach((c) => {
			networksSet.add(c.network);
			categoriesSet.add(c.category);
		});
		e.tags?.forEach((t) => {
			networksSet.add(t.network);
			tagsSet.add(t.tag);
		});

		return {
			...e,
			sets: {
				networks: Array.from(networksSet).map(NetworkMap.toURN),
				categories: Array.from(categoriesSet),
				tags: Array.from(tagsSet),
			},
		};
	});
};
