export function MultiselectScript() {
	return (
		<script>
			{`
    document.querySelectorAll(".multiselect").forEach(init);

    function init(root) {
      const input = root.querySelector("input");
      const results = root.querySelector(".results");
      const selectedWrap = root.querySelector(".selected");

      const name = root.dataset.name;
      const options = JSON.parse(root.dataset.options);
      const defaultSelected = JSON.parse(root.dataset.selected || "[]");

      const selected = new Map();

      const byValue = new Map(options.map(o => [String(o.value), o]));

      function renderResults(list) {
        results.innerHTML = "";
        if (!list.length) return results.classList.add("hidden");

        results.classList.remove("hidden");

        list.forEach(opt => {
          if (selected.has(opt.value)) return;

          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = opt.label;
          btn.className = "block w-full text-left px-2 py-1 hover:bg-zinc-800";

          btn.onclick = () => select(opt);
          results.appendChild(btn);
        });
      }

      function select(opt) {
        selected.set(opt.value, opt);
        input.value = "";
        results.classList.add("hidden");
        renderSelected();
      }

      function remove(value) {
        selected.delete(value);
        renderSelected();
      }

      function renderSelected() {
        selectedWrap.innerHTML = "";

        selected.forEach(opt => {
          const chip = document.createElement("span");
          chip.className =
            "inline-flex items-center gap-1 px-2 py-1 bg-zinc-900 rounded-md text-sm text-zinc-300";

          chip.innerHTML = opt.label + '<button type="button" class="text-zinc-500 hover:text-red-400">×</button>'+
            '<input type="hidden" name="' + name+'[]" value="'+opt.value+'" />';

          chip.querySelector("button").onclick = () => remove(opt.value);

          selectedWrap.appendChild(chip);
        });
      }

      defaultSelected.forEach(v => {
        const opt = byValue.get(String(v));
        if (opt) selected.set(String(v), opt);
      });

      renderSelected();

      input.addEventListener("input", () => {
        const q = input.value.toLowerCase();
        const filtered = options.filter(o =>
          o.label.toLowerCase().includes(q)
        );
        renderResults(filtered);
      });

      input.addEventListener("focus", () => renderResults(options));

      document.addEventListener("click", e => {
        if (!root.contains(e.target)) results.classList.add("hidden");
      });
    }`}
		</script>
	);
}

export function Multiselect({
	name,
	options,
	selected,
	placeholder = "Search…",
}: {
	name: string;
	selected?: Array<string | number>;
	options: Array<{ label: string; value: string | number }>;
	placeholder?: string;
}) {
	return (
		<div
			className="multiselect relative flex flex-col gap-1 text-sm"
			data-name={name}
			data-options={JSON.stringify(options)}
			data-selected={JSON.stringify(selected)}
		>
			<div className="selected flex flex-wrap gap-1" />

			<input
				name={`${name}-q`}
				type="search"
				placeholder={placeholder}
				className="px-2 py-1 ui-input"
			/>

			<div className="results absolute top-full mt-1 w-full max-h-48 overflow-auto rounded-md bg-zinc-900 border border-zinc-700 shadow-lg hidden z-10" />
		</div>
	);
}
