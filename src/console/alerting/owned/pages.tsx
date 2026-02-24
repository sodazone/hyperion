import { RulesRegistry } from "@/alerting/rules/templates/registry";
import { withAuth } from "@/console/authenticated";
import { render } from "@/server/render";
import { InvalidParameters } from "@/server/response";
import { ConsoleApp } from "../../app";
import { fetchAlertPage } from "../common/alert.fetch";
import { handleAlertPoll } from "../common/alert.poller";
import { MyAlertList } from "./alert.list";
import { RuleForm } from "./rule.form";
import { RulesList } from "./rule.list";
import { TemplateWizard } from "./rule.template";

export const RuleFormPage = withAuth<"/console/rules/form/:id">(
	async ({ db, req, ownerHash, user }) => {
		const ruleId = req.params.id;

		if (ruleId === "__new__") {
			let component: React.ReactElement | undefined;
			const q = new URL(req.url).searchParams;
			if (q.has("template")) {
				const templateId = q.get("template");
				if (templateId) {
					const template = RulesRegistry.find((rule) => rule.id === templateId);
					if (!template) return InvalidParameters;
					component = <RuleForm template={template} />;
				}
			}

			if (component === undefined) {
				component = <TemplateWizard templates={RulesRegistry} />;
			}

			if (req.headers.get("HX-Request")) {
				return render(component);
			}
			return render(
				<ConsoleApp member={user} path="/console/rules">
					{component}
				</ConsoleApp>,
			);
		}

		const existingRule = db.alerting.rules.getRuleInstance({
			id: Number(ruleId),
			owner: ownerHash,
		});
		if (!existingRule) return InvalidParameters;

		const template = RulesRegistry.find((t) => t.id === existingRule.ruleKey);
		if (!template) return InvalidParameters;

		const component = <RuleForm template={template} rule={existingRule} />;

		if (req.headers.get("HX-Request")) {
			return render(component);
		}
		return render(
			<ConsoleApp member={user} path="/console/rules">
				{component}
			</ConsoleApp>,
		);
	},
);

export const RuleListPage = withAuth(async ({ db, req, user, ownerHash }) => {
	const url = new URL(req.url);

	const cursor = url.searchParams.get("cursor") ?? undefined;
	const search = url.searchParams.get("q") ?? undefined;

	const { rows, cursorNext } = db.alerting.rules.findRuleInstances({
		owner: ownerHash,
		cursor,
		limit: 15,
	});

	const page = {
		rows: rows,
		cursorNext,
		cursorCurrent: cursor,
		filters: {
			q: search,
		},
	};

	if (req.headers.get("HX-Request")) {
		return render(<RulesList ctx={{ url }} page={page} />);
	}

	return render(
		<ConsoleApp member={user} path="/console/rules">
			<RulesList ctx={{ url }} page={page} />
		</ConsoleApp>,
	);
});

export const MyAlertListPage = withAuth(
	async ({ db, req, user, ownerHash }) => {
		const url = new URL(req.url);
		const page = fetchAlertPage(db, url, ownerHash);

		if (req.headers.get("HX-Request")) {
			return render(<MyAlertList ctx={{ url }} page={page} />);
		}

		return render(
			<ConsoleApp member={user} path="/console/my/alerts">
				<MyAlertList ctx={{ url }} page={page} />
			</ConsoleApp>,
		);
	},
);

export const MyAlertListPoller = withAuth(async ({ db, req, ownerHash }) => {
	return handleAlertPoll({
		path: "/console/my/alerts",
		db,
		req,
		owner: ownerHash,
	});
});
