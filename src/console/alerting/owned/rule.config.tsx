import { z } from "zod";
import type { FieldMeta } from "@/alerting";
import { Multiselect } from "@/console/components/multiselect";

export function ConfigField({
	name,
	schema,
	defaultValue,
}: {
	name: string;
	schema: z.ZodTypeAny;
	defaultValue?: any;
}) {
	const meta = schema.meta() as FieldMeta;
	const label = meta?.label ?? name;
	const placeholder = meta?.placeholder;
	const help = meta?.help;
	const suffix = meta?.suffix;

	const baseClass = "ui-input w-full px-2 py-1 text-sm";

	if (meta?.options) {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-400" key={name}>
				<span className="w-28">{meta.label}</span>
				<Multiselect
					name={name}
					options={meta.options}
					selected={defaultValue}
				/>
				{meta.help && <p className="text-xs text-zinc-500">{meta.help}</p>}
			</div>
		);
	}

	if (schema instanceof z.ZodBoolean) {
		return (
			<div className="flex items-center justify-between text-sm text-zinc-300">
				<label htmlFor={name}>{label}</label>

				<input
					type="checkbox"
					id={name}
					name={name}
					defaultChecked={defaultValue ?? false}
					className="h-4 w-4"
				/>
			</div>
		);
	}

	if (schema instanceof z.ZodEnum) {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-400">
				<label htmlFor={name}>{label}</label>

				<select
					id={name}
					name={name}
					defaultValue={defaultValue}
					className={baseClass}
				>
					{schema.options.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>

				{help && <span className="text-xs text-zinc-500">{help}</span>}
			</div>
		);
	}

	if (schema instanceof z.ZodNumber) {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-400">
				<label htmlFor={name}>{label}</label>

				<div className="relative flex items-center">
					<input
						type="text"
						id={name}
						name={name}
						inputMode="numeric"
						pattern="[0-9]*"
						hx-on:input="this.value=this.value.replace(/[^\d]/g,'')"
						defaultValue={defaultValue ?? ""}
						placeholder={placeholder}
						className={`${baseClass} ${suffix ? "pr-10" : ""}`}
					/>

					{suffix && (
						<span className="absolute right-2 text-xs text-zinc-500 pointer-events-none">
							{suffix}
						</span>
					)}
				</div>

				{help && <span className="text-xs text-zinc-500">{help}</span>}
			</div>
		);
	}
	return (
		<div className="flex flex-col gap-2 text-sm text-zinc-400">
			<label htmlFor={name}>{label}</label>

			<div className="relative flex items-center">
				<input
					type="text"
					id={name}
					name={name}
					defaultValue={defaultValue ?? ""}
					placeholder={placeholder}
					className={`${baseClass} ${suffix ? "pr-10" : ""}`}
				/>

				{suffix && (
					<span className="absolute right-2 text-xs text-zinc-500 pointer-events-none">
						{suffix}
					</span>
				)}
			</div>

			{help && <span className="text-xs text-zinc-500">{help}</span>}
		</div>
	);
}
