import { z } from "zod";
import type { RuleDefinition } from "@/alerting";
import { BackButton } from "@/console/components/btn.back";
import { MultiselectScript } from "@/console/components/select.multi";
import { ConfigField } from "./rule.config";

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

				<div className="flex flex-col space-y-1">
					<h1 className="text-lg font-semibold text-zinc-300">
						{template.title}
					</h1>
					{template.description && (
						<div className="text-zinc-400 text-sm max-w-lg">
							{template.description}
						</div>
					)}
				</div>
			</div>

			<MultiselectScript />

			<form
				method="post"
				action="/console/rules"
				hx-post="/console/rules"
				hx-target="#address-error"
				hx-disable-elt="button[type=submit]"
				className="w-full border border-zinc-900 p-6 rounded-md space-y-4"
			>
				<input type="hidden" name="ruleKey" value={template.id} />

				{/* Error div */}
				<div id="address-error" className="text-sm"></div>

				<div className="flex flex-col gap-2 mb-6">
					<label htmlFor="title" className="text-sm text-zinc-300">
						Alert Name <span className="text-pink-500">*</span>
					</label>
					<input
						id="title"
						type="text"
						required
						name="title"
						defaultValue={template.title}
						className="px-2 py-1 w-full ui-input"
					/>
					<span></span>
				</div>

				<fieldset className="flex flex-col space-y-2">
					<legend className="text-xs uppercase text-zinc-600 font-semibold">
						Alert Configuration
					</legend>
					<div className="flex flex-col gap-6">
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
			<script>{`document.querySelectorAll(".multiselect").forEach(initMultiselect);`}</script>
		</section>
	);
}
