export function sidebar() {
	return {
		mobileOpen: false,
		collapsed: false,
		STORAGE_KEY: "sidebar-collapsed",
		currentPath: window.location.pathname,

		get isMobile() {
			return window.matchMedia("(max-width: 767px)").matches;
		},

		init() {
			if (!this.isMobile) {
				this.collapsed = localStorage.getItem(this.STORAGE_KEY) === "true";
			}

			window.addEventListener("resize", () => {
				if (!this.isMobile) this.mobileOpen = false;
			});

			this.updateActiveLinks();

			document.body.addEventListener("htmx:afterSwap", () => {
				this.updateActiveLinks();
				this.closeMobile();
			});
		},

		openMobile() {
			if (this.isMobile) this.mobileOpen = true;
		},

		closeMobile() {
			if (this.isMobile) this.mobileOpen = false;
		},

		toggleDesktop() {
			if (this.isMobile) return;

			this.collapsed = !this.collapsed;
			localStorage.setItem(this.STORAGE_KEY, this.collapsed);
		},

		handleNavClick() {
			this.closeMobile();
		},

		linkClass(path) {
			return this.isActive(path)
				? "bg-zinc-900 text-zinc-100"
				: "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100";
		},

		isActive(path) {
			return (
				this.currentPath === path || this.currentPath.startsWith(`${path}/`)
			);
		},

		updateActiveLinks() {
			this.currentPath = window.location.pathname; // <-- recompute path
		},
	};
}
