import type { OpenGovEventType } from "@/alerting/rules/types";
import type { OpenGovPayload } from "./types";

export function mapEventType(payload: OpenGovPayload): OpenGovEventType | null {
	const name = payload.triggeredBy?.name ?? "";
	switch (name) {
		case "Referenda.DecisionStarted":
			return "deciding";
		case "Referenda.ConfirmStarted":
			return "confirming";
		case "Referenda.Confirmed":
			return "confirmed";
		case "Scheduler.Executed": {
			if (payload.execution?.result !== undefined) {
				const { success } = payload.execution.result;
				if (success) {
					return "execution_succeeded";
				} else {
					return "execution_failed";
				}
			} else {
				return "executed";
			}
		}
		case "Referenda.Killed": {
			return "killed";
		}
		case "Referenda.ConfirmAborted": {
			return "aborted";
		}
		case "Referenda.Cancelled": {
			return "cancelled";
		}
		case "Referenda.Rejected": {
			return "rejected";
		}
		default:
			return null;
	}
}

export function humanizeStatus(eventType: OpenGovEventType): string {
	switch (eventType) {
		case "confirming":
			return "Confirming";
		case "deciding":
			return "Deciding";
		case "confirmed":
			return "Confirmed";
		case "rejected":
			return "Rejected";
		case "executed":
			return "Executed";
		case "killed":
			return "Killed";
		case "cancelled":
			return "Cancelled";
		case "aborted":
			return "Aborted";
		case "execution_failed":
			return "Execution Failed";
		case "execution_succeeded":
			return "Execution Succeeded";
	}
}
