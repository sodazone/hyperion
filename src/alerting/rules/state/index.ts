import { InMemoryStateStore } from "./memory";
import { SqliteStateStore } from "./sqlite";

export function createStateStore(path: string) {
	return path === ":memory:"
		? new InMemoryStateStore()
		: new SqliteStateStore(path);
}
