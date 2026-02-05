import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function safePath(callerUrl: string | URL, relPath: string): string {
	const __filename = fileURLToPath(callerUrl);
	const __dirname = dirname(__filename);
	const rel = resolve(__dirname, relPath);
	if (rel.startsWith("..") || rel.includes("..")) {
		throw new Error("Path traversal detected");
	}

	return rel;
}

export function here(meta: ImportMeta) {
	const base = dirname(fileURLToPath(meta.url));

	return (...parts: string[]) => resolve(base, ...parts);
}
