import { AlertLevel } from "@/alerting";
import { createHyperionDB, PUBLIC_OWNER } from "@/db";
import type { NewRuleInstance } from "@/db/backend/sqlite/rules.db";
import { CAT } from "@/intel/mapping";

function resolveDataPath(): string {
	const args = process.argv.slice(2);

	const dataFlagIndex = args.indexOf("--data");
	if (dataFlagIndex !== -1 && args[dataFlagIndex + 1]) {
		return args[dataFlagIndex + 1] ?? "./.db/current";
	}

	if (args[0] && !args[0].startsWith("-")) {
		return args[0];
	}

	return "./.db/current";
}

if (Bun.env.TG_TOKEN === undefined || Bun.env.TG_CHAT_ID === undefined) {
	console.log("provide telegram channel env");
	process.exit(-1);
}

const telegramConfig = {
	token: Bun.env.TG_TOKEN,
	chatId: Bun.env.TG_CHAT_ID,
};

const dataPath = resolveDataPath();

console.log("Using DB path:", dataPath);

const db = await createHyperionDB(dataPath);

const id = db.alerting.rules.insertChannel({
	owner: PUBLIC_OWNER,
	name: "Public Alerts",
	type: "telegram",
	enabled: true,
	config: telegramConfig,
});

console.log(`Channel ID: ${id}`);

const RULES: NewRuleInstance[] = [
	{
		owner: PUBLIC_OWNER,
		ruleKey: "watched",
		title: "Sanctioned or Criminally Associated Entity",
		config: {
			level: AlertLevel.Critical,
			categories: [CAT.CYBERCRIME, CAT.SANCTIONS],
		},
		enabled: true,
		channelIds: [id],
	},
	{
		owner: PUBLIC_OWNER,
		ruleKey: "watched",
		title: "High-Risk or Compromised Entity",
		config: {
			level: AlertLevel.Warning,
			categories: [CAT.HIGH_RISK, CAT.COMPROMISED],
		},
		enabled: true,
		channelIds: [id],
	},
	{
		owner: PUBLIC_OWNER,
		ruleKey: "transfer",
		title: "Large-Scale Transfer (≥ $10M)",
		config: {
			level: AlertLevel.Warning,
			minUsd: 10_000_000,
		},
		enabled: true,
		channelIds: [id],
	},
	{
		owner: PUBLIC_OWNER,
		ruleKey: "transfer",
		title: "Significant Transfer (≥ $500K)",
		config: {
			level: AlertLevel.Info,
			minUsd: 500_000,
		},
		enabled: true,
		channelIds: [id],
	},
];

for (const rule of RULES) {
	db.alerting.rules.insertRuleInstance(rule);
}

console.log("Rules inserted successfully.");
