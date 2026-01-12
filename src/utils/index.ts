import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function safePath(callerUrl: string | URL, relPath: string): string {
	const __filename = fileURLToPath(callerUrl);
	const __dirname = dirname(__filename);
	return resolve(__dirname, relPath);
}
