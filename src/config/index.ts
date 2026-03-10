import { homedir } from "node:os";
import { resolve } from "node:path";

export function expandPath(path: string): string {
	if (path === "~") return homedir();
	if (path.startsWith("~/")) {
		return resolve(homedir(), path.slice(2));
	}
	return path;
}

export const config = {
	dataDir: expandPath(Bun.env.HYPERION_DATA_DIR ?? "~/.hyperion/data"),
	dbPath: expandPath(Bun.env.HYPERION_DB_PATH ?? "./.db/current"),
};
