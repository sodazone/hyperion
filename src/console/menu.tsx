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
		<div x-data="sidebar()" x-init="init()">
			{/* Mobile Header */}
			<div className="md:hidden flex items-center justify-between p-2 w-full fixed top-0 bg-linear-to-b from-zinc-950/90 via-zinc-950/75 to-zinc-950/0 z-20">
				<a href="/" className="flex items-center gap-2">
					<img src="/img/logo.svg" alt="Hyperion Logo" className="h-8 w-8" />
					<span className="text-sm font-semibold text-zinc-200">Hyperion</span>
				</a>

				<button
					type="button"
					className="p-2 rounded text-zinc-400 hover:text-zinc-200"
					aria-label="Open menu"
					x-on:click="openMobile()"
				>
					<MenuCloserIcon />
				</button>
			</div>

			{/* Overlay */}
			<div
				x-show="mobileOpen"
				x-transition=""
				x-on:click="closeMobile()"
				className="fixed inset-0 z-40 bg-black/50 md:hidden"
			/>

			{/* Sidebar */}
			<aside
				x-cloak=""
				className="h-screen border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-y-auto transition-all duration-200 ease-in-out"
				x-bind:class="{
          'fixed top-0 left-0 w-full max-w-xs z-50': isMobile,
          'md:w-14': collapsed && !isMobile,
          'md:w-64': !collapsed && !isMobile,
          '-translate-x-full': !mobileOpen && isMobile,
          'translate-x-0': mobileOpen || !isMobile
        }"
			>
				{/* Header */}
				<div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-zinc-800">
					<div className="flex items-center gap-2 min-w-0">
						<a href="/">
							<img alt="" src="/img/logo.svg" className="h-8 w-8" />
						</a>
						<div
							className="flex flex-col min-w-0"
							x-show="!collapsed || isMobile"
						>
							<span className="text-sm font-semibold truncate">
								<a href="/">Hyperion</a>
							</span>
							<span className="text-xs text-zinc-500 truncate">
								Intelligence Console
							</span>
						</div>
					</div>

					<div className="flex justify-center md:items-center md:h-12">
						<button
							type="button"
							className="hidden md:flex py-2 text-zinc-600 hover:text-zinc-300"
							x-on:click="toggleDesktop()"
						>
							<SidebarIcon size={18} />
						</button>
					</div>
				</div>
				{/* NAV */}
				<nav
					x-show="!collapsed || isMobile"
					className="flex-1 px-3 py-4 space-y-6 text-sm"
				>
					{/* Dashboard */}
					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
							<DashboardIcon />
							<span>Dashboard</span>
						</h3>
						<ul className="space-y-1">
							<li
								className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer"
								hx-get="/console/dashboard"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
								x-bind:class="linkClass('/console/dashboard')"
							>
								<span>Overview</span>
							</li>
						</ul>
					</div>

					{/* Alerting */}
					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
							<BellIcon />
							<span>Alerting</span>
						</h3>

						<ul className="space-y-1">
							<li
								className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer"
								hx-get="/console/public/alerts"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
								x-bind:class="linkClass('/console/public/alerts')"
							>
								<span>Public Alerts</span>
							</li>

							{authenticated && (
								<>
									<li
										className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer"
										hx-get="/console/my/alerts"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
										x-bind:class="linkClass('/console/my/alerts')"
									>
										<span>My Alerts</span>
									</li>

									<li
										className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer"
										hx-get="/console/rules"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
										x-bind:class="linkClass('/console/rules')"
									>
										<span>Rules</span>
									</li>

									<li
										className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer"
										hx-get="/console/channels"
										hx-target="#main-content"
										hx-push-url="true"
										x-bind:class="linkClass('/console/channels')"
									>
										<span>Channels</span>
									</li>
								</>
							)}
						</ul>
					</div>

					{/* Entities */}
					<div>
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
							<TagIcon />
							<span>Entities</span>
						</h3>

						<ul className="space-y-1">
							<li
								className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer"
								hx-get="/console/entities"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
								x-bind:class="linkClass('/console/entities')"
							>
								<span>Public Registry</span>
							</li>

							{authenticated && (
								<li
									className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer"
									hx-get="/console/watchlist"
									hx-target="#main-content"
									hx-push-url="true"
									hx-swap="innerHTML swap:80ms"
									x-bind:class="linkClass('/console/watchlist')"
								>
									<span>My Registry</span>
								</li>
							)}
						</ul>
					</div>
				</nav>
				{/* Account */}
				<div
					x-show="!collapsed || isMobile"
					className="collapsible border-t border-zinc-800 p-4 shrink-0 overflow-hidden"
				>
					{!authenticated ? (
						<a href="/login" className="w-full ui-btn">
							<span className="w-full text-center text-sm">Sign in</span>
						</a>
					) : (
						<div>
							<div className="flex items-center gap-3 overflow-x-hidden">
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
			</aside>
		</div>
	);
}
