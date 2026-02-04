import type { Entity, HyperionDB } from "@/db";
import type { AuthApi } from "@/server/auth/stytch";

export type EntityRow = Entity & {
	sets: {
		networks: Array<string | undefined>;
		categories: number[];
		tags: string[];
	};
};

export type PageContext = {
	db: HyperionDB;
	authApi: AuthApi;
};
