import { z } from "zod";
import type { FieldMeta } from "@/alerting";
import { ChevronUpDownIcon } from "@/console/components/icons";
import { Multiselect } from "@/console/components/multiselect";
import { NetworkCache } from "@/console/network.cache";

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
	while ("unwrap" in schema && typeof schema.unwrap === "function") {
		schema = schema.unwrap();
	}
	return schema;
}

function isOptional(schema: z.ZodTypeAny) {
	return schema.safeParse(undefined).success;
}

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
	const required = !isOptional(schema);

	if (meta?.options) {
		if (meta.multiple) {
			return (
				<div className="flex flex-col gap-2 text-sm text-zinc-300" key={name}>
					<span className="w-28">
						{meta.label} {required && <span className="text-pink-500">*</span>}
					</span>
					<Multiselect
						name={name}
						options={meta.options}
						selected={defaultValue}
					/>
					{meta.help && <p className="text-xs text-zinc-400">{meta.help}</p>}
				</div>
			);
		}

		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-300" key={name}>
				<label htmlFor={name} className="w-28">
					{meta.label} {required && <span className="text-pink-500">*</span>}
				</label>
				<div className="ui-select w-fit">
					<select
						id={name}
						name={name}
						className="scrollbar-ui"
						required={required}
						defaultValue={defaultValue}
					>
						{meta.options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<div className="ui-select-btn">
						<ChevronUpDownIcon />
					</div>
				</div>
				{meta.help && <p className="text-xs text-zinc-400">{meta.help}</p>}
			</div>
		);
	}

	if (meta?.input === "select-networks") {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-300" key={name}>
				<span className="w-28">
					{meta.label} {required && <span className="text-pink-500">*</span>}
				</span>
				<Multiselect
					name={name}
					placeholder="Search networks…"
					options={NetworkCache.all().map((n) => ({
						label: n.name,
						value: n.urn,
					}))}
					selected={defaultValue}
				/>
				{meta.help && <p className="text-xs text-zinc-400">{meta.help}</p>}
			</div>
		);
	}

	if (meta?.input === "select-tags") {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-300" key={name}>
				<span className="w-28">
					{meta.label} {required && <span className="text-pink-500">*</span>}
				</span>

				<div
					id={`tags-${name}`}
					hx-get="/console/rules/fragments/tags"
					hx-trigger="load"
					hx-swap="outerHTML"
					hx-target={`#tags-${name}`}
					className="px-2 py-1 w-full min-h-8 animate-pulse bg-zinc-900/60 ui-input"
				></div>

				{meta.help && <p className="text-xs text-zinc-400">{meta.help}</p>}
			</div>
		);
	}

	const unwrapped = unwrap(schema);

	if (unwrapped instanceof z.ZodBoolean) {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-300">
				<label htmlFor={name} className="ui-checkbox">
					<input
						id={name}
						name={name}
						defaultChecked={defaultValue ?? false}
						className="peer"
						type="checkbox"
					/>
					<svg
						className="pointer-events-none absolute ml-0.5 hidden h-3 w-3 text-zinc-900 peer-checked:block"
						viewBox="0 0 20 20"
						fill="currentColor"
						role="img"
						aria-label="true"
					>
						<path
							fill-rule="evenodd"
							d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.42 0l-3.2-3.2a1 1 0 111.42-1.42l2.49 2.49 6.49-6.49a1 1 0 011.42 0z"
							clip-rule="evenodd"
						/>
					</svg>

					<span>{label}</span>
				</label>

				{help && <span className="text-xs text-zinc-400">{help}</span>}
			</div>
		);
	}

	if (unwrapped instanceof z.ZodEnum) {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-300">
				<label htmlFor={name}>
					{label} {required && <span className="text-pink-500">*</span>}
				</label>

				<select
					id={name}
					name={name}
					required={required}
					defaultValue={defaultValue}
					className={baseClass}
				>
					{unwrapped.options.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>

				{help && <span className="text-xs text-zinc-400">{help}</span>}
			</div>
		);
	}

	if (unwrapped instanceof z.ZodNumber) {
		return (
			<div className="flex flex-col gap-2 text-sm text-zinc-300">
				<label htmlFor={name}>
					{label} {required && <span className="text-pink-500">*</span>}
				</label>

				<div className="relative flex items-center">
					<input
						type="text"
						id={name}
						name={name}
						inputMode="numeric"
						pattern="[0-9]*"
						required={required}
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

				{help && <span className="text-xs text-zinc-400">{help}</span>}
			</div>
		);
	}
	return (
		<div className="flex flex-col gap-2 text-sm text-zinc-300">
			<label htmlFor={name}>
				{label} {required && <span className="text-pink-500">*</span>}
			</label>

			<div className="relative flex items-center">
				<input
					type="text"
					id={name}
					name={name}
					required={required}
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

			{help && <span className="text-xs text-zinc-400">{help}</span>}
		</div>
	);
}
