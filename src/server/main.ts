import { serve } from "./serve";

await serve({
	dbPath: Bun.env.HYPERION_DB_PATH || "./.db/current",
});
