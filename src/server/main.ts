import { config } from "@/config";
import { serve } from "./serve";

await serve({
	dbPath: config.dbPath,
});
