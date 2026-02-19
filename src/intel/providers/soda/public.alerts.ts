import { AlertLevel } from "@/alerting";
import { createHyperionDB, PUBLIC_OWNER } from "@/db";
import { CAT } from "@/intel/mapping";

const RULES = [
	{
		owner: PUBLIC_OWNER,
		ruleKey: "watched",
		title: "Sanctioned or Criminally Associated Entity",
		config: {
			level: AlertLevel.Critical,
			categories: [CAT.CYBERCRIME, CAT.SANCTIONS],
		},
	},
	{
		owner: PUBLIC_OWNER,
		ruleKey: "watched",
		title: "High-Risk or Compromised Entity",
		config: {
			level: AlertLevel.Warning,
			categories: [CAT.HIGH_RISK, CAT.COMPROMISED],
		},
	},
	{
		owner: PUBLIC_OWNER,
		ruleKey: "transfer",
		title: "Large-Scale Transfer (≥ $10M)",
		config: {
			level: AlertLevel.Warning,
			minUsd: 10_000_000,
		},
	},
	{
		owner: PUBLIC_OWNER,
		ruleKey: "transfer",
		title: "Significant Transfer (≥ $500K)",
		config: {
			level: AlertLevel.Info,
			minUsd: 500_000,
		},
	},
];

const db = await createHyperionDB("./.db/current");
for (const rule of RULES) {
	db.alerting.rules.insertRuleInstance(rule);
}
