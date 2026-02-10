import { STATIC_RULES } from "@/alerting/rules/bundles/static";
import { withAuth } from "@/console/authenticated";
import { render } from "@/server/render";
import { InvalidParameters } from "@/server/response";
import { ConsoleApp } from "../../app";
import { fetchAlertPage } from "../common/alert.fetch";
import { MyAlertList } from "./alert.list";
import { RuleForm } from "./rule.form";
import { RulesList } from "./rule.list";
import { TemplateWizard } from "./rule.template";

export const RuleFormPage = withAuth<"/console/rules/form/:id">(
	async ({ req, user }) => {
		if (req.params.id === "__new__") {
			let component: React.ReactElement | undefined;
			const q = new URL(req.url).searchParams;
			if (q.has("template")) {
				const templateId = q.get("template");
				if (templateId) {
					const template = STATIC_RULES.find((rule) => rule.id === templateId);
					if (!template) return InvalidParameters;
					component = <RuleForm template={template} />;
				}
			}

			if (component === undefined) {
				component = <TemplateWizard templates={STATIC_RULES} />;
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
		return InvalidParameters;
	},
);

export const RuleListPage = withAuth(async ({ db, req, user, ownerHash }) => {
	const url = new URL(req.url);

	const cursor = url.searchParams.get("cursor") ?? undefined;
	const search = url.searchParams.get("q") ?? undefined;

	const { rows, cursorNext } = db.alerts.findRuleInstances({
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
