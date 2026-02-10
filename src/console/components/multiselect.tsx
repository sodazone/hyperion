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
            "inline-flex items-center gap-2 px-2 py-1 bg-zinc-900 rounded-md text-sm text-zinc-300";

          chip.innerHTML = opt.label + '<button type="button" class="text-center text-zinc-500 px-1.5 hover:text-red-400">x</button>'+
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

      let activeIndex = -1;

      function close() {
        results.classList.add("hidden");
        activeIndex = -1;
      }

      function open(list = options) {
        renderResults(list);
      }

      function highlight(index) {
        const items = results.querySelectorAll("button");
        items.forEach(el => el.classList.remove("bg-zinc-800"));

        if (items[index]) {
          items[index].classList.add("bg-zinc-800");
          items[index].scrollIntoView({ block: "nearest" });
        }
      }

      input.addEventListener("input", () => {
        const q = input.value.toLowerCase();
        const filtered = options.filter(o =>
          o.label.toLowerCase().includes(q)
        );
        activeIndex = -1;
        open(filtered);
      });

      input.addEventListener("focus", () => open());

      input.addEventListener("keydown", (e) => {
        const items = results.querySelectorAll("button");

        switch (e.key) {
          case "Escape":
            close();
            input.blur();
            break;

          case "ArrowDown":
            e.preventDefault();
            if (!items.length) return;
            activeIndex = (activeIndex + 1) % items.length;
            highlight(activeIndex);
            break;

          case "ArrowUp":
            e.preventDefault();
            if (!items.length) return;
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            highlight(activeIndex);
            break;

          case "Enter":
            if (items[activeIndex]) {
              e.preventDefault();
              items[activeIndex].click();
            }
            break;

          case "Tab":
            close();
            break;

          case "Backspace":
            if (!input.value && selected.size) {
              const last = Array.from(selected.keys()).pop();
              remove(last);
            }
            break;
        }
      });

      document.addEventListener("click", e => {
        if (!root.contains(e.target)) close();
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
