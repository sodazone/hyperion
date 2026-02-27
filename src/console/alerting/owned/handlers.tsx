import { ZodError } from "zod";
import { RulesRegistry } from "@/alerting/rules/templates/registry";
import { withAuth } from "@/console/authenticated";
import { InternalServerError, InvalidParameters } from "@/server/response";
import { safeString } from "@/utils/strings";

function strNumOrBool(v: any) {
	return !Number.isNaN(Number(v)) && v !== ""
		? Number(v)
		: v === "on"
			? true
			: v;
}

const RedirectToRules = () =>
	new Response(null, {
		status: 200,
		headers: { "HX-Redirect": "/console/rules" },
	});

export const RuleDeleteHandler = withAuth<"/console/rules/:id">(
	async ({ db, monitor, req, ownerHash }) => {
		try {
			const id = Number(req.params.id);

			if (id === undefined || Number.isNaN(id)) return InvalidParameters;

			db.alerting.rules.deleteRuleInstance({
				id,
				owner: ownerHash,
			});

			monitor.rules.remove(id);

			return RedirectToRules();
		} catch (error) {
			console.error(error);
			return InternalServerError;
		}
	},
);

export const RuleUpsertHandler = withAuth<"/console/rules">(
	async ({ db, monitor, req, ownerHash }) => {
		try {
			const formData = await req.formData();
			const ruleId = formData.get("id");
			const title = safeString(formData.get("title"));
			const enabled = formData.get("enabled")?.toString() === "on";

			if (!title || title.length < 2 || title.length > 200)
				return InvalidParameters;

			const data: Record<string, any> = Object.create(null);
			const channelIdsSet: Set<number> = new Set();

			for (const key of formData.keys()) {
				const allValues = formData.getAll(key);
				if (key.endsWith("[]")) {
					const dataKey = key.slice(0, -2);
					if (dataKey === "channelIds") {
						allValues.forEach((v) => {
							channelIdsSet.add(Number(v));
						});
					} else {
						data[dataKey] = allValues.map(strNumOrBool);
					}
				} else if (allValues.length === 1) {
					data[key] = strNumOrBool(allValues[0]);
				} else {
					data[key] = allValues.map(strNumOrBool);
				}
			}

			const channelIds = Array.from(channelIdsSet);

			if (ruleId === "__new__") {
				const templateId = formData.get("ruleKey")?.toString();
				if (!templateId) return InvalidParameters;

				const template = RulesRegistry.find((t) => t.id === templateId);
				if (!template) return InvalidParameters;

				const parsed = template.schema?.parse(data) ?? {};

				const id = db.alerting.rules.insertRuleInstance({
					owner: ownerHash,
					ruleKey: template.id,
					title: safeString(title),
					config: parsed,
					enabled,
					channelIds,
				});

				const inserted = db.alerting.rules.getRuleInstance({
					id,
					owner: ownerHash,
				});
				if (!inserted) return InternalServerError;

				monitor.rules.add(inserted);

				return RedirectToRules();
			} else {
				const id = Number(ruleId);
				if (Number.isNaN(id)) return InvalidParameters;

				const ownedId = { id, owner: ownerHash };
				if (!db.alerting.rules.isRuleOwned(ownedId)) return InvalidParameters;

				const existing = db.alerting.rules.getRuleInstance(ownedId);
				if (!existing) return InvalidParameters;

				const template = RulesRegistry.find((t) => t.id === existing.ruleKey);
				if (!template) return InvalidParameters;

				const parsed = template.schema?.parse(data) ?? {};

				db.alerting.rules.updateRuleInstance(ownedId, {
					title: safeString(title),
					config: parsed,
					enabled,
				});

				const updated = db.alerting.rules.getRuleInstance(ownedId);
				if (!updated) throw InternalServerError;

				if (channelIds.length > 0) {
					db.alerting.rules.attachChannelsToRule(ownedId, channelIds);
				} else {
					db.alerting.rules.dettachChannelsFromRule(ownedId);
				}

				monitor.rules.update(updated);

				return RedirectToRules();
			}
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
								.map((e) => `<li>${e}</li>`)
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
	},
);
