export function multiselect({
	name,
	options,
	selected = [],
	required = false,
}) {
	return {
		name,
		options,
		required,
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

			this.$watch("query", () => {
				this.highlightIndex = -1;
			});

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
				const validator = this.$el.querySelector("[data-validator]");
				if (validator) {
					validator.setCustomValidity("");
				}

				const input = this.$refs.input;
				if (input) {
					input.dispatchEvent(new Event("change", { bubbles: true }));
				}
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
			const items = this.filteredOptions;

			switch (e.key) {
				case "Escape":
					this.closeDropdown();
					this.$refs.input?.blur();
					break;

				case "ArrowDown":
					e.preventDefault();
					if (!items.length) return;

					this.highlightIndex = (this.highlightIndex + 1) % items.length;
					break;

				case "ArrowUp":
					e.preventDefault();
					if (!items.length) return;

					this.highlightIndex =
						(this.highlightIndex - 1 + items.length) % items.length;
					break;

				case "Enter":
					if (this.highlightIndex >= 0 && this.highlightIndex < items.length) {
						e.preventDefault();
						this.select(items[this.highlightIndex]);
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
