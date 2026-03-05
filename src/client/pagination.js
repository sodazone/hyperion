export function pagination({ totalItems, perPage = 5 }) {
	return {
		currentPage: 1,
		perPage,
		totalItems,

		totalPages() {
			return Math.ceil(this.totalItems / this.perPage);
		},

		isVisible(index) {
			const start = (this.currentPage - 1) * this.perPage + 1;
			const end = start + this.perPage - 1;
			return index >= start && index <= end;
		},

		pages() {
			const total = this.totalPages();
			const current = this.currentPage;
			const delta = window.innerWidth < 640 ? 1 : 2;

			const range = [];
			const result = [];
			let last;

			for (let i = 1; i <= total; i++) {
				if (
					i === 1 ||
					i === total ||
					(i >= current - delta && i <= current + delta)
				) {
					range.push(i);
				}
			}

			for (const i of range) {
				if (last) {
					if (i - last === 2) {
						result.push({ type: "page", value: last + 1, key: `p${last + 1}` });
					} else if (i - last > 2) {
						result.push({ type: "ellipsis", key: `e${i}` });
					}
				}

				result.push({ type: "page", value: i, key: `p${i}` });
				last = i;
			}

			return result;
		},

		prevPage() {
			if (this.currentPage > 1) this.currentPage--;
		},
		nextPage() {
			if (this.currentPage < this.totalPages()) this.currentPage++;
		},
		goToPage(page) {
			this.currentPage = page;
		},
	};
}
