import { ZodError } from "zod";
import { STATIC_RULES } from "@/alerting/rules/bundles/static";
import { hashOwner } from "@/auth";
import type { HyperionDB } from "@/db";
import type { AuthApi } from "../auth/stytch";
import {
	InternalServerError,
	InvalidParameters,
	Unauthorized,
} from "../response";

export async function RulePostHandler(
	{ authApi, db }: { db: HyperionDB; authApi: AuthApi },
	req: Bun.BunRequest,
) {
	const user = await authApi.getAuthenticatedUser(req);
	if (!user) return Unauthorized;

	const formData = await req.formData();
	const templateId = formData.get("ruleKey")?.toString();

	if (!templateId) return InvalidParameters;

	const template = STATIC_RULES.find((r) => r.id === templateId);
	if (!template) return InvalidParameters;

	// Map the form to be parsed
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
		const owner = hashOwner(user.email);

		db.alerts.insertRuleInstance({
			owner,
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
}
