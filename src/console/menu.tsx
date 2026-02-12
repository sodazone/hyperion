import type { Member } from "@/auth/types";
import { BellIcon, MenuCloserIcon, TagIcon } from "./components/icons";
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
				className="fixed top-0 left-0 z-50 w-full max-w-xs h-full md:w-64 md:relative md:flex flex-col border-r border-zinc-800 bg-zinc-950 transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out"
			>
				<div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-800 h-18">
					<a href="/" className="flex items-center gap-2">
						<img src="/img/logo.svg" alt="Hyperion Logo" className="h-8 w-8" />
						<div className="flex flex-col">
							<span className="text-sm font-semibold tracking-wide">
								Hyperion
							</span>
							<span className="text-xs text-zinc-500">
								Intelligence Console
							</span>
						</div>
					</a>
				</div>

				<nav className="flex-1 overflow-auto px-3 py-4 space-y-6 text-sm">
					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
							<BellIcon />
							<span>Alerting</span>
						</h3>
						<ul className="space-y-1">
							<li
								className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
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
										className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
										data-href="/console/my/alerts"
										hx-get="/console/my/alerts"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
									>
										My Alerts
									</li>
									<li
										className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
										data-href="/console/rules"
										hx-get="/console/rules"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
									>
										Rules
									</li>
									{/*
									<li
										className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
										data-href="/console/destinations"
										hx-get="/console/destinations"
										hx-target="#main-content"
										hx-push-url="true"
									>
										Destinations
									</li>
									*/}
								</>
							)}
						</ul>
					</div>

					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
							<TagIcon />
							<span>Entities</span>
						</h3>
						<ul className="space-y-1">
							<li
								className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
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
									className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
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
				<div className="border-t border-zinc-800 p-4">
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
              const toggle = document.getElementById('sidebar-toggle');

              const isMobile = () => window.innerWidth < 768;

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

              toggle.addEventListener('click', openSidebar);
              overlay.addEventListener('click', closeSidebar);

              // auto-close on link click (mobile only)
              sidebar.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', closeSidebar);
              });

              window.addEventListener('resize', () => {
                if (!isMobile()) {
                  sidebar.classList.remove('-translate-x-full');
                  overlay.classList.add('hidden');
                } else {
                  sidebar.classList.add('-translate-x-full');
                }
              });

              function updateSidebarActive() {
                const path = window.location.pathname;
                document.querySelectorAll("#sidebar .nav-link").forEach(el => {
                if(path === el.dataset.href || path.startsWith(el.dataset.href + "/")) {
                    el.classList.add("bg-zinc-900", "text-zinc-100");
                    el.classList.remove("text-zinc-400", "hover:text-zinc-200");
                  } else {
                    el.classList.remove("bg-zinc-900", "text-zinc-100");
                    el.classList.add("text-zinc-400", "hover:text-zinc-200");
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
