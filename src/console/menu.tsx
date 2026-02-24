import type { Member } from "@/auth/types";
import {
	BellIcon,
	DashboardIcon,
	MenuCloserIcon,
	SidebarIcon,
	TagIcon,
} from "./components/icons";
import { trunc } from "./util";

type Props = {
	member?: Member | null;
};

export function Sidebar({ member }: Props) {
	const authenticated = !!member;

	return (
		<>
			<div className="md:hidden flex items-center justify-between p-2 w-full fixed top-0 bg-linear-to-b from-zinc-950/90 via-zinc-950/75 to-zinc-950/0">
				<a href="/" className="flex items-center gap-2">
					<img src="/img/logo.svg" alt="Hyperion Logo" className="h-8 w-8" />
					<span className="text-sm font-semibold text-zinc-200">Hyperion</span>
				</a>
				<button
					type="button"
					id="sidebar-toggle"
					className="p-2 rounded text-zinc-400 hover:text-zinc-200"
					aria-label="Open menu"
				>
					<MenuCloserIcon />
				</button>
			</div>

			<div
				id="sidebar-overlay"
				className="fixed inset-0 z-40 bg-black/50 hidden md:hidden"
			/>

			<aside
				id="sidebar"
				className="fixed top-0 left-0 z-50 w-full max-w-xs h-full md:w-64 md:relative md:flex flex-col border-r border-zinc-800 bg-zinc-950 transform -translate-x-full md:translate-x-0 transition-all duration-200 ease-in-out"
			>
				<div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-zinc-800 h-18">
					<div className="collapsible flex items-center gap-2 min-w-0">
						<a href="/">
							<img
								src="/img/logo.svg"
								alt="Hyperion Logo"
								className="h-8 w-8"
							/>
						</a>
						<div className="flex flex-col min-w-0">
							<span className="text-sm font-semibold tracking-wide truncate">
								<a href="/" className="block truncate">
									Hyperion
								</a>
							</span>
							<span className="text-xs text-zinc-500 truncate">
								<a href="/" className="block truncate">
									Intelligence Console
								</a>
							</span>
						</div>
					</div>
					<button
						type="button"
						id="sidebar-desktop-toggle"
						className="hidden md:flex py-2 text-zinc-600 hover:text-zinc-300"
						aria-label="Toggle sidebar"
					>
						<SidebarIcon size={18} />
					</button>
				</div>

				<nav className="collapsible flex-1 px-3 py-4 space-y-6 text-sm overflow-hidden">
					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
							<DashboardIcon />
							<span>Dashboard</span>
						</h3>
						<ul className="space-y-1">
							<li
								className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
								data-href="/console/dashboard"
								hx-get="/console/dashboard"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
							>
								Overview
							</li>
						</ul>
					</div>
					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
							<BellIcon />
							<span>Alerting</span>
						</h3>
						<ul className="space-y-1">
							<li
								className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
								data-href="/console/public/alerts"
								hx-get="/console/public/alerts"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
							>
								Public Alerts
							</li>
							{authenticated && (
								<>
									<li
										className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
										data-href="/console/my/alerts"
										hx-get="/console/my/alerts"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
									>
										My Alerts
									</li>
									<li
										className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
										data-href="/console/rules"
										hx-get="/console/rules"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
									>
										Rules
									</li>
									<li
										className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
										data-href="/console/channels"
										hx-get="/console/channels"
										hx-target="#main-content"
										hx-push-url="true"
									>
										Channels
									</li>
								</>
							)}
						</ul>
					</div>

					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
							<TagIcon />
							<span>Entities</span>
						</h3>
						<ul className="space-y-1">
							<li
								className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
								data-href="/console/entities"
								hx-get="/console/entities"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
							>
								Public Registry
							</li>
							{authenticated && (
								<li
									className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer"
									data-href="/console/watchlist"
									hx-get="/console/watchlist"
									hx-target="#main-content"
									hx-push-url="true"
									hx-swap="innerHTML swap:80ms"
								>
									My Registry
								</li>
							)}
						</ul>
					</div>
				</nav>

				{/* Account */}
				<div className="collapsible border-t border-zinc-800 p-4">
					{!authenticated ? (
						<a href="/login" className="w-full ui-btn">
							<span className="w-full text-center text-sm">Sign in</span>
						</a>
					) : (
						<div>
							<div className="flex items-center gap-3 overflow-hidden">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
									{member.name?.[0] ?? member.email?.[0] ?? "?"}
								</div>
								<div className="flex flex-col text-sm">
									<span className="text-zinc-200 truncate">
										{member.name ?? member.email}
									</span>
									{member.name && (
										<span className="text-xs text-zinc-500 truncate">
											{trunc(member.organization ?? "member", 25)}
										</span>
									)}
								</div>
							</div>
							<button
								type="button"
								hx-post="/logout"
								hx-trigger="click"
								hx-swap="none"
								className="mt-3 w-full ui-btn"
							>
								<span className="w-full text-center text-xs">Sign out</span>
							</button>
						</div>
					)}
				</div>

				<script>
					{`
            (() => {
              const sidebar = document.getElementById('sidebar');
              const overlay = document.getElementById('sidebar-overlay');
              const mobileToggle = document.getElementById('sidebar-toggle');
              const desktopToggle = document.getElementById('sidebar-desktop-toggle');

              const STORAGE_KEY = 'sidebar-collapsed';

              const isMobile = () => window.innerWidth < 768;

              /* ------------------ MOBILE ------------------ */

              const openSidebar = () => {
                if (!isMobile()) return;
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
              };

              const closeSidebar = () => {
                if (!isMobile()) return;
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
              };

              mobileToggle?.addEventListener('click', openSidebar);
              overlay?.addEventListener('click', closeSidebar);

              sidebar.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', closeSidebar);
              });

              /* ------------------ DESKTOP ------------------ */

              const collapseDesktop = () => {
                sidebar.classList.add('md:w-14');
                sidebar.classList.remove('md:w-64');
                sidebar.classList.add('sidebar-collapsed');
                localStorage.setItem(STORAGE_KEY, 'true');
              };

              const expandDesktop = () => {
                sidebar.classList.remove('md:w-14');
                sidebar.classList.add('md:w-64');
                sidebar.classList.remove('sidebar-collapsed');
                localStorage.setItem(STORAGE_KEY, 'false');
              };

              const toggleDesktop = () => {
                if (isMobile()) return;

                if (sidebar.classList.contains('sidebar-collapsed')) {
                  expandDesktop();
                } else {
                  collapseDesktop();
                }
              };

              desktopToggle?.addEventListener('click', toggleDesktop);

              /* Restore persisted state */
              if (!isMobile() && localStorage.getItem(STORAGE_KEY) === 'true') {
                collapseDesktop();
              }

              /* Handle resize */
              window.addEventListener('resize', () => {
                if (!isMobile()) {
                  sidebar.classList.remove('-translate-x-full');
                  overlay.classList.add('hidden');
                } else {
                  sidebar.classList.add('-translate-x-full');
                }
              });

              /* ------------------ ACTIVE LINK ------------------ */

              function updateSidebarActive() {
                const path = window.location.pathname;
                document.querySelectorAll("#sidebar .nav-link").forEach(el => {
                  if (path === el.dataset.href || path.startsWith(el.dataset.href + "/")) {
                    el.classList.add("bg-zinc-900", "text-zinc-100");
                    el.classList.remove("text-zinc-300", "hover:text-zinc-100");
                  } else {
                    el.classList.remove("bg-zinc-900", "text-zinc-100");
                    el.classList.add("text-zinc-300", "hover:text-zinc-100");
                  }
                });
              }

              document.addEventListener("DOMContentLoaded", updateSidebarActive);
              document.body.addEventListener("htmx:afterSwap", updateSidebarActive);
            })();
          `}
				</script>
			</aside>
		</>
	);
}
