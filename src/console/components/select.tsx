import { ChevronUpDownIcon } from "./icons";

export function RichSelect({
	name,
	options,
	selected,
}: {
	name: string;
	selected: string;
	options: Array<{
		label: string;
		value: string;
		icon?: string;
	}>;
}) {
	const current = (options.find((o) => o.value === selected) || options[0]) ?? {
		value: "",
		label: "",
	};

	return (
		<div
			className="rich-select relative w-56 text-sm"
			data-name={name}
			data-value={current.value}
		>
			<input type="hidden" name={name} value={current.value} />

			<button
				type="button"
				className="flex items-center justify-between w-full px-3 py-2 text-zinc-500 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors"
			>
				<span className="flex items-center gap-2 text-zinc-200">
					{current.icon && (
						<img
							alt=""
							src={current.icon}
							className="bg-zinc-900 w-6 h-6 rounded-full"
						/>
					)}
					<span>{current.label}</span>
				</span>
				<ChevronUpDownIcon />
			</button>

			<div className="options absolute top-full mt-1 w-full max-h-48 overflow-auto bg-zinc-900 border border-zinc-700 shadow-lg hidden z-10">
				{options.map((opt) => (
					<button
						key={opt.value}
						type="button"
						data-value={opt.value}
						className="option flex items-center gap-2 w-full px-2 py-1 hover:bg-zinc-800 text-left"
					>
						{opt.icon && (
							<img
								alt=""
								src={opt.icon}
								className="bg-zinc-950 w-4 h-4 rounded-full"
							/>
						)}
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
}

export function RichSelectScript() {
	return (
		<script>
			{`
      function initRichSelect(root) {
        if (root._initialized) return;
        root._initialized = true;

        const trigger = root.querySelector("button");
        const dropdown = root.querySelector(".options");
        const hiddenInput = root.querySelector("input[type=hidden]");

        trigger.addEventListener("click", (e) => {
          e.stopPropagation();

          dropdown.classList.toggle("hidden");
        });

        function updateVisibleOptions() {
          const currentValue = hiddenInput.value;

          const optionButtons = dropdown.querySelectorAll(".option");

          optionButtons.forEach(btn => {
            const isSelected = btn.dataset.value === currentValue;
            btn.classList.toggle("hidden", isSelected);
          });
        }

        dropdown.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const value = btn.dataset.value;
            const label = btn.innerHTML;

            hiddenInput.value = value;
            trigger.querySelector("span").innerHTML = label;
            dropdown.classList.add("hidden");

            updateVisibleOptions();

            hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
          });

          updateVisibleOptions();
        });

        document.addEventListener("click", e => {
          if (!root.contains(e.target)) {
            dropdown.classList.add("hidden");
          }
        });
      }

      document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".rich-select").forEach(initRichSelect);
      });

      document.body.addEventListener("htmx:afterSwap", (evt) => {
        const container = evt.detail.target;
        container.querySelectorAll?.(".rich-select").forEach(initRichSelect);
      });
  `}
		</script>
	);
}
