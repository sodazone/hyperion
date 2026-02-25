export function richSelect({ name, options, selected }) {
	return {
		name,
		options,
		open: false,
		value: selected || options[0]?.value || "",

		get current() {
			return (
				this.options.find((o) => o.value === this.value) || this.options[0]
			);
		},

		select(val) {
			this.value = val;
			this.open = false;

			this.$nextTick(() => {
				const input = this.$refs.hidden;
				input.dispatchEvent(new Event("change", { bubbles: true }));
			});
		},

		toggle() {
			this.open = !this.open;
		},

		close() {
			this.open = false;
		},
	};
}
