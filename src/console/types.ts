import type { Entity, HyperionDB } from "@/db";
import type { AuthApi } from "@/server/auth/stytch";
import type { NetworkInfos } from "./extra.infos";

export type EntityRow = Entity & {
	sets: {
		networks: Array<string | undefined>;
		categories: number[];
		tags: string[];
	};
};

export type PageContext = {
	db: HyperionDB;
	networkInfos: NetworkInfos;
	authApi: AuthApi;
};
