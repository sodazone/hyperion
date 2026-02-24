export function Checkbox({
	label,
	name,
	defaultValue,
}: {
	label: string;
	name: string;
	defaultValue?: boolean;
}) {
	return (
		<label className="ui-checkbox inline-flex items-center gap-2 cursor-pointer">
			<span className="relative flex h-4 w-4 items-center justify-center">
				<input
					id={name}
					name={name}
					type="checkbox"
					defaultChecked={defaultValue ?? false}
					className="peer h-4 w-4 appearance-none rounded border border-zinc-700 bg-zinc-900 checked:bg-zinc-200"
				/>

				<svg
					className="pointer-events-none absolute hidden h-3 w-3 text-zinc-900 peer-checked:block"
					viewBox="0 0 20 20"
					fill="currentColor"
					role="img"
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.42 0l-3.2-3.2a1 1 0 111.42-1.42l2.49 2.49 6.49-6.49a1 1 0 011.42 0z"
						clipRule="evenodd"
					/>
				</svg>
			</span>

			<span>{label}</span>
		</label>
	);
}
