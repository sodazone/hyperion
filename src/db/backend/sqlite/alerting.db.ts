import { Database } from "bun:sqlite";
import { type AlertsDB, createAlertsDB } from "./alerts.db";
import { createRulesDB, type RulesDB } from "./rules.db";

export class AlertingDB {
	private db: Database;
	alerts: AlertsDB;
	rules: RulesDB;

	constructor(path = "alerting.sqlite") {
		this.db = new Database(path);
		this.alerts = createAlertsDB(this.db);
		this.rules = createRulesDB(this.db);
		this.init();
	}

	private init() {
		this.db.run(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA foreign_keys = ON;
    `);
		this.alerts.init();
		this.rules.init();
	}

	close() {
		this.db.close();
	}
}
