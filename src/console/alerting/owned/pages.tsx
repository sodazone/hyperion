import { RulesRegistry } from "@/alerting/rules/templates/registry";
import { withAuth } from "@/console/authenticated";
import { render } from "@/server/render";
import { InvalidParameters, Ok } from "@/server/response";
import { ConsoleApp } from "../../app";
import { fetchAlertPage, parseAlertsUrlParams } from "../common/alert.fetch";
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
		return InvalidParameters;
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

export const MyAlertListUpdates = withAuth(async ({ db, req, ownerHash }) => {
	const url = new URL(req.url);
	const { after, network, severity, search } = parseAlertsUrlParams(url);
	const count = db.alerting.alerts.countAlerts({
		owner: ownerHash,
		after,
		levelMin: severity,
		levelMax: severity,
		network,
		address: search,
	});

	if (count === 0) {
		return Ok;
	}

	if (req.headers.get("HX-Request")) {
		const params = new URLSearchParams();

		if (network != null) params.set("network", String(network));
		if (severity != null) params.set("severity", String(severity));
		if (search) params.set("search", search);

		const hxGet = `/console/my/alerts${params.size ? `?${params}` : ""}`;

		return render(
			<div
				className="text-sm inline-flex ml-auto px-2 py-2 text-zinc-500 cursor-pointer items-center gap-1.5"
				hx-get={hxGet}
				hx-target="#main-content"
				hx-swap="innerHTML swap:80ms"
			>
				<span className="text-zinc-300 font-semibold">{count}</span>
				<span className="pr-1">new {count > 1 ? "alerts" : "alert"}</span>
				<span className="relative flex h-2.5 w-2.5 items-center justify-center">
					<span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
					<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				</span>
			</div>,
		);
	}

	return Ok;
});
