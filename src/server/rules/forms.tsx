import { ZodError } from "zod";
import { RulesRegistry } from "@/alerting/rules/templates/registry";
import { RuleCard } from "@/console/alerting/owned/rule.list";
import { withAuth } from "@/console/authenticated";
import { render } from "../render";
import { InternalServerError, InvalidParameters, Ok } from "../response";

function strOrNumber(v: any) {
	return !Number.isNaN(Number(v)) && v !== "" ? Number(v) : v;
}

export const RuleDeleteHandler = withAuth<"/console/rules/:id">(
	async ({ db, monitor, req, ownerHash }) => {
		try {
			const id = Number(req.params.id);

			if (id === undefined || Number.isNaN(id)) throw InvalidParameters;

			const ownedId = { id, owner: ownerHash };
			if (!db.alerting.rules.isRuleOwned(ownedId)) throw InvalidParameters;

			db.alerting.rules.deleteRuleInstance(ownedId);

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
			const formData = await req.formData();
			const enabled = formData.get("enabled")?.toString() === "on";

			if (id == null || enabled == null || Number.isNaN(id))
				return InvalidParameters;

			const ownedId = { id, owner: ownerHash };
			if (!db.alerting.rules.isRuleOwned(ownedId)) return InvalidParameters;

			db.alerting.rules.updateRuleInstance(ownedId, {
				enabled,
			});

			const updated = db.alerting.rules.getRuleInstance(ownedId);
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
	const title = formData.get("title")?.toString();

	if (!templateId || !title || title.length > 200 || title.length < 2)
		return InvalidParameters;

	const template = RulesRegistry.find((r) => r.id === templateId);
	if (!template) return InvalidParameters;

	const data: Record<string, any> = {};

	for (const key of formData.keys()) {
		const allValues = formData.getAll(key);

		if (key.endsWith("[]")) {
			const dataKey = key.substring(0, key.length - 2);
			data[dataKey] = allValues.map(strOrNumber);
		} else if (allValues.length === 1) {
			const value = allValues[0];
			data[key] = strOrNumber(value);
		} else {
			data[key] = allValues.map(strOrNumber);
		}
	}

	try {
		const parsed = template.schema?.parse(data) ?? {};

		db.alerting.rules.insertRuleInstance({
			owner: ownerHash,
			ruleKey: template.id,
			title: title,
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
