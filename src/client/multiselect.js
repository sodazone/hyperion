export function multiselect({ name, options, selected = [] }) {
	return {
		name,
		options,
		query: "",
		open: false,
		selectedItems: [],

		init() {
			// populate selectedItems from selected values
			this.selectedItems = Array.from(
				new Map(
					(selected ?? [])
						.map((v) =>
							options.find((o) => o.value.toString() === v.toString()),
						)
						.filter(Boolean)
						.map((s) => [s.value.toString(), s]),
				).values(),
			);

			// generate hidden inputs
			this.$nextTick(() => {
				this.dispatchChange();
			});
		},

		get filteredOptions() {
			const q = this.query.toLowerCase();
			return this.options.filter(
				(o) =>
					!this.selectedItems.find((s) => s.value === o.value) &&
					o.label.toLowerCase().includes(q),
			);
		},

		select(opt) {
			this.selectedItems.push(opt);
			this.query = "";
			this.open = false;
			this.dispatchChange();
		},

		remove(opt) {
			this.selectedItems = this.selectedItems.filter(
				(s) => s.value !== opt.value,
			);
			this.dispatchChange();
		},

		dispatchChange() {
			this.$nextTick(() => {
				this.$refs.input.dispatchEvent(new Event("change", { bubbles: true }));
			});
		},

		openDropdown() {
			this.open = true;
		},

		closeDropdown() {
			this.open = false;
		},

		highlightIndex: -1,

		keyDown(e) {
			const items = this.$refs.results?.querySelectorAll("button") || [];
			switch (e.key) {
				case "Escape":
					this.closeDropdown();
					this.$refs.input.blur();
					break;
				case "ArrowDown":
					e.preventDefault();
					if (!items.length) return;
					this.highlightIndex = (this.highlightIndex + 1) % items.length;
					items[this.highlightIndex].scrollIntoView({ block: "nearest" });
					break;
				case "ArrowUp":
					e.preventDefault();
					if (!items.length) return;
					this.highlightIndex =
						(this.highlightIndex - 1 + items.length) % items.length;
					items[this.highlightIndex].scrollIntoView({ block: "nearest" });
					break;
				case "Enter":
					if (items[this.highlightIndex]) {
						e.preventDefault();
						items[this.highlightIndex].click();
					}
					break;
				case "Backspace":
					if (!this.query && this.selectedItems.length) {
						this.remove(this.selectedItems[this.selectedItems.length - 1]);
					}
					break;
				case "Tab":
					this.closeDropdown();
					break;
			}
		},
	};
}
