import { ZodError } from "zod";
import { STATIC_RULES } from "@/alerting/rules/bundles/static";
import { RuleCard } from "@/console/alerting/owned/rule.list";
import { withAuth } from "@/console/authenticated";
import { render } from "../render";
import { InternalServerError, InvalidParameters, Ok } from "../response";

export const RuleDeleteHandler = withAuth<"/console/rules/:id">(
	async ({ db, monitor, req, ownerHash }) => {
		try {
			const id = Number(req.params.id);

			if (id === undefined || Number.isNaN(id)) throw InvalidParameters;

			const ownedId = { id, owner: ownerHash };
			if (!db.alerts.isRuleOwned(ownedId)) throw InvalidParameters;

			db.alerts.deleteRuleInstance(ownedId);

			monitor.rules.remove(id.toString());

			return Ok;
		} catch (error) {
			console.error(error);
			if (error instanceof ZodError) {
				return InvalidParameters;
			}
			return InternalServerError;
		}
	},
);

export const RulePutHandler = withAuth<"/console/rules/:id">(
	async ({ db, monitor, req, ownerHash }) => {
		try {
			const id = Number(req.params.id);
			const url = new URL(req.url);
			const enabled = url.searchParams.get("enabled");

			if (id === undefined || enabled === undefined || Number.isNaN(id))
				throw InvalidParameters;

			const ownedId = { id, owner: ownerHash };
			if (!db.alerts.isRuleOwned(ownedId)) throw InvalidParameters;

			db.alerts.updateRuleInstance(ownedId, {
				enabled: enabled === "1",
			});

			const updated = db.alerts.getRuleInstance(ownedId);
			if (!updated) throw InternalServerError;

			monitor.rules.setEnabled(updated.id, updated.enabled);

			return render(<RuleCard rule={updated} />);
		} catch (error) {
			console.error(error);
			if (error instanceof ZodError) {
				return InvalidParameters;
			}
			return InternalServerError;
		}
	},
);

export const RulePostHandler = withAuth(async ({ db, req, ownerHash }) => {
	const formData = await req.formData();
	const templateId = formData.get("ruleKey")?.toString();

	if (!templateId) return InvalidParameters;

	const template = STATIC_RULES.find((r) => r.id === templateId);
	if (!template) return InvalidParameters;

	const data: Record<string, any> = {};

	for (const key of formData.keys()) {
		const allValues = formData.getAll(key);

		if (allValues.length === 1) {
			const value = allValues[0];
			if (value === "on") {
				data[key] = true;
			} else if (!Number.isNaN(Number(value)) && value !== "") {
				data[key] = Number(value);
			} else {
				data[key] = value;
			}
		} else {
			data[key] = allValues.map((v) =>
				!Number.isNaN(Number(v)) && v !== "" ? Number(v) : v,
			);
		}
	}

	try {
		const parsed = template.schema?.parse(data) ?? {};

		db.alerts.insertRuleInstance({
			owner: ownerHash,
			ruleKey: template.id,
			config: parsed,
			enabled: true,
		});

		return new Response(null, {
			status: 200,
			headers: { "HX-Redirect": "/console/rules" },
		});
	} catch (err) {
		if (err instanceof ZodError) {
			const errors: Record<string, string> = {};
			for (const issue of err.issues) {
				errors[issue.path[0] as string] = issue.message;
			}

			return new Response(
				`
              <div class="text-pink-400 text-sm mt-1">
              <ul>
                ${Object.values(errors)
									.map((error) => `<li>${error}</li>`)
									.join("")}
              </ul>
              </div>
            `,
				{ headers: { contentType: "text/html" }, status: 200 },
			);
		}

		console.error(err);
		return InternalServerError;
	}
});
