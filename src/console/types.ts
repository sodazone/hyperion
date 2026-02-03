import type { Entity } from "@/db";

export type EntityRow = Entity & {
	sets: {
		networks: Array<string | undefined>;
		categories: number[];
		tags: string[];
	};
};
