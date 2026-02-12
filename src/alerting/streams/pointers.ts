import { promises as fs } from "node:fs";
import path from "node:path";

type PointerMap = Record<string, number>;

export function createPointerStorage(dbPath: string) {
	if (dbPath === ":memory:") {
		const mem: PointerMap = {};
		return {
			load: async (k: string) => mem[k],
			save: async (_k: string, _id: number) => {},
		};
	}

	const FILE = path.resolve(dbPath, ".ocelloids-pointers.json");

	let cache: PointerMap = {};
	let dirty = false;
	let timer: NodeJS.Timeout | undefined;

	async function readFile() {
		try {
			cache = JSON.parse(await fs.readFile(FILE, "utf8"));
		} catch {
			cache = {};
		}
	}

	async function flush() {
		if (!dirty) return;

		await fs.writeFile(`${FILE}.tmp`, JSON.stringify(cache), "utf8");
		await fs.rename(`${FILE}.tmp`, FILE);

		dirty = false;
	}

	function scheduleFlush() {
		if (timer) return;

		timer = setTimeout(async () => {
			await flush();
			timer = undefined;
		}, 1_000);
	}

	async function load(key: string) {
		if (!Object.keys(cache).length) {
			await readFile();
		}
		return cache[key];
	}

	function save(key: string, id: number) {
		cache[key] = id;
		dirty = true;
		scheduleFlush();
	}

	return { load, save };
}
