import { z } from "zod";
import type { RuleDefinition } from "@/alerting";
import { BackButton } from "@/console/components/btn.back";
import { ConfigField } from "./rule.config";

const Icons: Record<string, React.ReactNode> = {
	"value-movement": (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M16 16H2v2h14v4l6-5-6-5zM8 1 2 6l6 5V7h14V5H8z"></path>
		</svg>
	),
} as const;

export function RuleForm({
	template,
}: {
	template: RuleDefinition<any, any, any>;
}) {
	const schema = template.schema ?? z.object({});
	const defaults = template.defaults ?? {};
	const fields = Object.entries(schema.shape ?? {}).map(([k, s]) => ({
		key: k,
		schema: s,
		defaultValue: defaults[k],
	}));

	return (
		<section className="h-full min-h-screen flex flex-col max-w-full md:w-4xl lg:w-5xl md:mx-auto space-y-8">
			<div className="flex gap-6 items-center">
				<BackButton href="/console/rules/form/__new__" />

				<h1 className="text-lg font-semibold text-zinc-300">
					{template.title}
				</h1>
			</div>
			<form
				method="post"
				action="/console/rules"
				hx-post="/console/rules"
				hx-target="#address-error"
				hx-disable-elt="button[type=submit]"
				className="w-full border border-zinc-900 p-6 rounded-md space-y-4"
			>
				<input type="hidden" name="ruleKey" value={template.id} />

				{template.description && (
					<div className="flex flex-col space-y-1">
						<div className="text-xs uppercase text-zinc-600 font-semibold">
							Description
						</div>
						<div className="text-zinc-300 text-sm max-w-md">
							{template.description}
						</div>
					</div>
				)}

				{/* Error div */}
				<div id="address-error" className="text-sm"></div>

				<fieldset className="flex flex-col space-y-2">
					<legend className="text-xs uppercase text-zinc-600 font-semibold">
						Configuration
					</legend>
					<div className="flex flex-col gap-2">
						{fields.map((f) => (
							<ConfigField
								key={f.key}
								name={f.key}
								schema={f.schema}
								defaultValue={f.defaultValue}
							/>
						))}
					</div>
				</fieldset>

				<div className="flex justify-end gap-2 pt-2">
					<button
						type="button"
						hx-get="/console/rules/form/__new__"
						hx-target="#main-content"
						hx-push-url="true"
						className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
					>
						Cancel
					</button>
					<button type="submit" className="ui-btn">
						Save Alert
					</button>
				</div>
			</form>
		</section>
	);
}

export function TemplateWizard({
	templates,
}: {
	templates: RuleDefinition<any, any, any>[];
}) {
	if (!templates.length) {
		return (
			<p className="text-zinc-500 text-center py-12 text-sm">
				No templates available
			</p>
		);
	}

	return (
		<div className="h-full min-h-screen flex flex-col max-w-full md:w-4xl lg:w-5xl md:mx-auto space-y-8">
			<div className="flex gap-6 items-center">
				<BackButton href="/console/rules" />

				<h1 className="text-lg font-semibold text-zinc-300">Templates</h1>
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				{templates.map((t) => (
					<div
						key={t.id}
						className="bg-zinc-900/80 p-4 md:rounded-lg shadow-md"
					>
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-4">
								<div className="w-10 h-10 bg-teal-700/70 flex items-center rounded-md justify-center">
									{Icons[t.id]}
								</div>
								<div className="flex flex-col gap-1">
									<span className="font-semibold text-zinc-100">{t.title}</span>
									<span className="text-zinc-600 text-xs uppercase">
										id: {t.id}
									</span>
								</div>
							</div>
							{t.description && (
								<p className="text-zinc-300 text-sm">{t.description}</p>
							)}

							<button
								type="button"
								className="w-full ui-btn"
								hx-get={`/console/rules/form/__new__?template=${t.id}`}
								hx-target="#main-content"
							>
								<span className="w-full text-center">Create Alert</span>
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
