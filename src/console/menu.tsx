import type { Member } from "@/auth/types";
import {
	BellIcon,
	BookmarkIcon,
	DashboardIcon,
	LoginIcon,
	MenuCloserIcon,
	RadioIcon,
	ShieldAlertIcon,
	SidebarIcon,
	SlidersIcon,
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
			{/* MOBILE TOP HEADER */}
			<div className="md:hidden flex items-center justify-between p-2.5 w-full fixed top-0 bg-linear-to-b from-zinc-950/90 via-zinc-950/75 to-zinc-950/0 z-20">
				<a href="/" className="flex items-center gap-2">
					<img src="/img/logo.svg" alt="Hyperion Logo" className="h-8 w-8" />
					<span className="text-sm font-semibold text-zinc-200">Hyperion</span>
				</a>

				<button
					type="button"
					className="p-2 rounded text-zinc-400 hover:text-zinc-200"
					aria-label="Open menu"
					{...{ "x-on:click": "openMobile()" }}
				>
					<MenuCloserIcon />
				</button>
			</div>

			{/* MOBILE BACKDROP OVERLAY */}
			<div
				x-show="mobileOpen"
				x-transition=""
				{...{ "x-on:click": "closeMobile()" }}
				className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
			/>

			{/* DESKTOP SPACER RAIL */}
			<div
				className="hidden md:block shrink-0 transition-all duration-200"
				{...{ "x-bind:class": "collapsed ? 'w-14' : 'w-64'" }}
			/>

			{/* SIDEBAR PANEL */}
			<aside
				x-cloak=""
				className="h-dvh border-r border-zinc-800/80 bg-zinc-950 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-200 ease-in-out pb-safe fixed top-0 left-0 z-30"
				{...{
					"x-bind:class":
						"{ 'w-full max-w-xs z-50': isMobile, 'md:w-14': collapsed && !isMobile, 'md:w-64': !collapsed && !isMobile, '-translate-x-full': !mobileOpen && isMobile, 'translate-x-0': mobileOpen || !isMobile }",
				}}
			>
				{/* SIDEBAR HEADER */}
				<div className="flex items-center justify-between px-3 border-b border-zinc-800/80 h-16 shrink-0 relative">
					{/* MOBILE HEADER VIEW */}
					<div
						className="flex items-center justify-between w-full min-w-0"
						{...{ "x-show": "!collapsed || isMobile" }}
					>
						<div className="flex items-center gap-2.5 min-w-0">
							<a href="/" className="shrink-0">
								<img
									alt="Hyperion Logo"
									src="/img/logo.svg"
									className="h-8 w-8"
								/>
							</a>
							<div className="flex flex-col min-w-0">
								<span className="text-sm font-semibold truncate text-zinc-100">
									<a href="/">Hyperion</a>
								</span>
								<span className="text-[11px] text-zinc-500 truncate">
									Intelligence Console
								</span>
							</div>
						</div>

						<button
							type="button"
							className="hidden md:flex p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors shrink-0"
							{...{ "x-on:click": "toggleDesktop()" }}
							title="Collapse Sidebar"
						>
							<SidebarIcon size={18} />
						</button>
					</div>

					{/* COLLAPSED HEADER */}
					<button
						type="button"
						className="hidden md:flex group relative w-full h-full items-center justify-center cursor-pointer focus:outline-hidden"
						{...{
							"x-show": "collapsed && !isMobile",
							"x-on:click": "toggleDesktop()",
						}}
						title="Expand Sidebar"
					>
						<img
							alt="Hyperion Logo"
							src="/img/logo.svg"
							className="h-8 w-8 transition-opacity duration-150 group-hover:opacity-0"
						/>

						<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-zinc-400 group-hover:text-zinc-100">
							<SidebarIcon size={18} />
						</div>
					</button>
				</div>

				{/* NAVIGATION LINKS */}
				<nav className="flex-1 px-2 py-4 space-y-5 text-sm">
					{/* DASHBOARD */}
					<div>
						<h3
							className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
							x-show="!collapsed || isMobile"
						>
							Dashboard
						</h3>
						<div
							className="h-px bg-zinc-800/60 my-2"
							{...{ "x-show": "collapsed && !isMobile" }}
						/>
						<ul className="space-y-1">
							<li
								className="flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors"
								hx-get="/console/dashboard"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
								{...{ "x-bind:class": "linkClass('/console/dashboard')" }}
								title="Overview"
							>
								<div className="flex h-5 w-5 shrink-0 items-center justify-center">
									<DashboardIcon />
								</div>
								<span x-show="!collapsed || isMobile" className="truncate">
									Overview
								</span>
							</li>
						</ul>
					</div>

					{/* ALERTING */}
					<div>
						<h3
							className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
							x-show="!collapsed || isMobile"
						>
							Alerting
						</h3>
						<div
							className="h-px bg-zinc-800/60 my-2"
							{...{ "x-show": "collapsed && !isMobile" }}
						/>
						<ul className="space-y-1">
							<li
								className="flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors"
								hx-get="/console/public/alerts"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
								{...{ "x-bind:class": "linkClass('/console/public/alerts')" }}
								title="Public Alerts"
							>
								<div className="flex h-5 w-5 shrink-0 items-center justify-center">
									<BellIcon />
								</div>
								<span x-show="!collapsed || isMobile" className="truncate">
									Public Alerts
								</span>
							</li>

							{authenticated && (
								<>
									<li
										className="flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors"
										hx-get="/console/my/alerts"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
										{...{ "x-bind:class": "linkClass('/console/my/alerts')" }}
										title="My Alerts"
									>
										<div className="flex h-5 w-5 shrink-0 items-center justify-center">
											<ShieldAlertIcon />
										</div>
										<span x-show="!collapsed || isMobile" className="truncate">
											My Alerts
										</span>
									</li>

									<li
										className="flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors"
										hx-get="/console/rules"
										hx-target="#main-content"
										hx-push-url="true"
										hx-swap="innerHTML swap:80ms"
										{...{ "x-bind:class": "linkClass('/console/rules')" }}
										title="Rules"
									>
										<div className="flex h-5 w-5 shrink-0 items-center justify-center">
											<SlidersIcon />
										</div>
										<span x-show="!collapsed || isMobile" className="truncate">
											Rules
										</span>
									</li>

									<li
										className="flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors"
										hx-get="/console/channels"
										hx-target="#main-content"
										hx-push-url="true"
										{...{ "x-bind:class": "linkClass('/console/channels')" }}
										title="Channels"
									>
										<div className="flex h-5 w-5 shrink-0 items-center justify-center">
											<RadioIcon />
										</div>
										<span x-show="!collapsed || isMobile" className="truncate">
											Channels
										</span>
									</li>
								</>
							)}
						</ul>
					</div>

					{/* ENTITIES */}
					<div>
						<h3
							className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
							x-show="!collapsed || isMobile"
						>
							Entities
						</h3>
						<div
							className="h-px bg-zinc-800/60 my-2"
							{...{ "x-show": "collapsed && !isMobile" }}
						/>
						<ul className="space-y-1">
							<li
								className="flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors"
								hx-get="/console/entities"
								hx-target="#main-content"
								hx-push-url="true"
								hx-swap="innerHTML swap:80ms"
								{...{ "x-bind:class": "linkClass('/console/entities')" }}
								title="Public Registry"
							>
								<div className="flex h-5 w-5 shrink-0 items-center justify-center">
									<TagIcon />
								</div>
								<span x-show="!collapsed || isMobile" className="truncate">
									Public Registry
								</span>
							</li>

							{authenticated && (
								<li
									className="flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors"
									hx-get="/console/watchlist"
									hx-target="#main-content"
									hx-push-url="true"
									hx-swap="innerHTML swap:80ms"
									{...{ "x-bind:class": "linkClass('/console/watchlist')" }}
									title="My Registry"
								>
									<div className="flex h-5 w-5 shrink-0 items-center justify-center">
										<BookmarkIcon />
									</div>
									<span x-show="!collapsed || isMobile" className="truncate">
										My Registry
									</span>
								</li>
							)}
						</ul>
					</div>
				</nav>

				{/* ACCOUNT */}
				<div className="border-t border-zinc-800/80 p-3 shrink-0 overflow-hidden">
					{!authenticated ? (
						<div>
							<a
								href="/login"
								className="w-full ui-btn flex items-center justify-center gap-2"
								x-show="!collapsed || isMobile"
							>
								<span className="text-sm">Sign in</span>
							</a>

							<a
								href="/login"
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 mx-auto transition-colors"
								{...{ "x-show": "collapsed && !isMobile" }}
								title="Sign in"
							>
								<LoginIcon />
							</a>
						</div>
					) : (
						<div>
							<div x-show="!collapsed || isMobile">
								<div className="flex items-center gap-3 overflow-hidden">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-700/50">
										{member.name?.[0] ?? member.email?.[0] ?? "?"}
									</div>
									<div className="flex flex-col text-sm min-w-0">
										<span className="text-zinc-200 font-medium truncate">
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

							<div
								className="flex justify-center"
								{...{ "x-show": "collapsed && !isMobile" }}
								title={member.name ?? member.email}
							>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-700/50">
									{member.name?.[0] ?? member.email?.[0] ?? "?"}
								</div>
							</div>
						</div>
					)}
				</div>
			</aside>
		</div>
	);
}
