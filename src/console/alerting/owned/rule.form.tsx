import { z } from "zod";
import type { RuleDefinition, RuleInstance } from "@/alerting";
import { BackButton } from "@/console/components/btn.back";
import { Checkbox } from "@/console/components/checkbox";
import { ConfigField } from "./rule.config";

export function RuleForm({
	template,
	rule,
}: {
	template: RuleDefinition<any, any, any>;
	rule?: RuleInstance;
}) {
	const schema = template.schema ?? z.object({});
	const defaults = template.defaults ?? {};
	const fields = Object.entries(schema.shape ?? {}).map(([k, s]) => ({
		key: k,
		schema: s,
		defaultValue: rule?.config?.[k] ?? defaults[k],
	}));

	const isEdit = !!rule;
	const method = isEdit ? "hx-put" : "hx-post";
	const backLink = isEdit ? "/console/rules" : "/console/rules/form/__new__";

	return (
		<section className="h-full min-h-screen flex flex-col max-w-full md:w-4xl lg:w-5xl md:mx-auto space-y-8">
			<div className="flex gap-6 items-center">
				<BackButton href={backLink} />

				<div className="flex flex-col space-y-1">
					<h1 className="text-lg font-semibold text-zinc-300">
						{rule?.title ?? template.title}
					</h1>
					{template.description && (
						<div className="text-zinc-400 text-sm max-w-lg">
							{template.description}
						</div>
					)}
				</div>
				{isEdit && (
					<button
						type="button"
						hx-delete={`/console/rules/${rule?.id}`}
						hx-on:click="event.stopPropagation()"
						hx-confirm="Delete this rule?"
						className="ml-auto px-2"
					>
						<span className="text-zinc-400 hover:text-red-400 text-sm">
							Delete
						</span>
					</button>
				)}
			</div>

			<form
				{...{ [method]: "/console/rules" }}
				hx-target="#rule-error"
				hx-disable-elt="button[type=submit]"
				className="w-full border border-zinc-900 p-6 rounded-md space-y-4"
			>
				<input type="hidden" name="id" value={rule?.id ?? "__new__"} />
				<input
					type="hidden"
					name="ruleKey"
					value={rule?.ruleKey ?? template?.id}
				/>

				{/* Error div */}
				<div id="rule-error" className="text-sm"></div>

				<div className="flex items-center gap-4 mb-6">
					<div className="flex flex-col flex-1 gap-2">
						<label htmlFor="title" className="text-sm text-zinc-300">
							Alert Name <span className="text-pink-500">*</span>
						</label>
						<input
							id="title"
							type="text"
							required
							name="title"
							defaultValue={rule?.title ?? template.title}
							className="px-2 py-1 w-full ui-input"
						/>
					</div>
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

				<fieldset className="flex flex-col space-y-2">
					<legend className="text-xs uppercase text-zinc-600 font-semibold">
						Delivery Channels
					</legend>

					<div
						id="channels-selector"
						hx-get={`/console/channels/options?s=${rule?.channels?.map((c) => c.id).join(",") ?? ""}`}
						hx-trigger="load"
						hx-swap="outerHTML"
						hx-target="#channels-selector"
						className="px-2 py-1 w-full min-h-8 animate-pulse bg-zinc-900/60 ui-input"
					></div>

					<div className="text-xs text-zinc-400">
						Select where alerts should be delivered.
					</div>
				</fieldset>

				<div className="flex flex-col gap-2 text-sm text-zinc-300">
					<Checkbox
						name="enabled"
						defaultValue={rule?.enabled ?? true}
						label="Enabled"
					/>
					<div className="text-xs text-zinc-400">
						Enable or disable this rule.
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<button
						type="button"
						hx-get={backLink}
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
