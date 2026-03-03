import type { OpenGovEventType } from "@/alerting/rules/types";

export function mapEventType(name: string): OpenGovEventType | null {
	if (name.includes("DecisionStarted")) return "deciding";
	if (name.includes("Approved")) return "approved";
	if (name.includes("Rejected")) return "rejected";
	if (name.includes("ExecutionFailed")) return "execution_failed";
	return null;
}

export function humanizeStatus(eventType: OpenGovEventType): string {
	switch (eventType) {
		case "deciding":
			return "Deciding";
		case "approved":
			return "Approved";
		case "rejected":
			return "Rejected";
		case "execution_failed":
			return "Execution Failed";
	}
}
