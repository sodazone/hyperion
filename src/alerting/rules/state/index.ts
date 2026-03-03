import { FileStateStore } from "./file";
import { InMemoryStateStore } from "./memory";

export function createStateStore(path: string) {
	return path === ":memory:"
		? new InMemoryStateStore()
		: new FileStateStore(path);
}
