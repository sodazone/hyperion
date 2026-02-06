import type { Entity } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import type { EntityRow } from "./types";

export function withCursor(url: URL, cursor?: string | null) {
	if (cursor) url.searchParams.set("cursor", cursor);
	else url.searchParams.delete("cursor");

	return `${url.pathname}?${url.searchParams.toString()}`;
}

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

export function truncMid(str: string, startLength = 6, endLength = 6) {
	if (!str) return str;

	const slen = str.startsWith("0x") ? startLength + 2 : startLength;

	if (str.length <= slen + endLength) return str;
	return `${str.slice(0, slen)}…${str.slice(-endLength)}`;
}
