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
