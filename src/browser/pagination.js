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
			const mobile = window.innerWidth < 640;

			const result = [];

			if (mobile) {
				result.push({ type: "page", value: 1, key: "p1" });

				if (current > 3) {
					result.push({ type: "ellipsis", key: "el" });
				}

				if (current !== 1 && current !== total) {
					result.push({ type: "page", value: current, key: `p${current}` });
				}

				if (current < total - 2) {
					result.push({ type: "ellipsis", key: "er" });
				}

				if (total > 1) {
					result.push({ type: "page", value: total, key: `p${total}` });
				}

				return result;
			}

			// desktop
			const pages = new Set([1, total]);

			for (let i = current - 2; i <= current + 2; i++) {
				if (i > 1 && i < total) pages.add(i);
			}

			const sorted = [...pages].sort((a, b) => a - b);

			let prev;

			for (const p of sorted) {
				if (prev && p - prev > 1) {
					result.push({ type: "ellipsis", key: `e${p}` });
				}
				result.push({ type: "page", value: p, key: `p${p}` });
				prev = p;
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
