import type { Member } from "@/auth/types";
import { BellIcon, TagIcon } from "./components/icons";

function isActive(currentPath: string, href: string) {
	return currentPath === href || currentPath.startsWith(`${href}/`);
}

function navItemClass(active: boolean) {
	return [
		"flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer",
		active
			? "bg-zinc-900 text-zinc-100"
			: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
	].join(" ");
}

type Props = {
	path: string;
	member?: Member | null;
};

function Section({
	title,
	children,
}: {
	title: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div>
			<h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
				{title}
			</h3>
			<ul className="space-y-1">{children}</ul>
		</div>
	);
}

function NavItem({ label }: { label: string }) {
	return (
		<li className="flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer">
			{label}
		</li>
	);
}

function NavLink({
	label,
	href,
	path,
}: {
	label: string;
	href: string;
	path: string;
}) {
	const active = isActive(path, href);

	return (
		<li
			className={navItemClass(active)}
			hx-get={href}
			hx-target="#main-panel"
			hx-push-url="true"
		>
			{label}
		</li>
	);
}

function Account({ member }: { member?: Member | null }) {
	if (member == null) {
		return (
			<div className="border-t border-zinc-800 p-4">
				<a
					href="/login"
					className="block w-full rounded-md border border-zinc-800 px-3 py-1.5 text-center text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
				>
					Sign in
				</a>
			</div>
		);
	}

	return (
		<div className="border-t border-zinc-800 p-4">
			<div className="flex items-center gap-3">
				<div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
					{member.name?.[0] ?? member.email?.[0] ?? "?"}
				</div>

				<div className="flex flex-col text-sm">
					<span className="text-zinc-200">{member.name ?? member.email}</span>
					<span className="text-xs text-zinc-500">{member.role ?? "User"}</span>
				</div>
			</div>

			<button
				type="button"
				hx-post="/logout"
				hx-trigger="click"
				hx-swap="none"
				className="mt-3 w-full rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
			>
				Sign out
			</button>
		</div>
	);
}

export function Sidebar({ member, path }: Props) {
	return (
		<aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950">
			{/* Brand */}
			<div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-800">
				<div className="flex items-center justify-center">
					<img src="/img/logo.svg" alt="Hyperion Logo" className="h-8 w-8" />
				</div>
				<div className="flex flex-col">
					<span className="text-sm font-semibold tracking-wide">Hyperion</span>
					<span className="text-xs text-zinc-500">Intelligence Console</span>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-auto px-3 py-4 space-y-6 text-sm">
				{/* Alerting */}
				<Section
					title={
						<span className="flex items-center gap-2">
							<BellIcon />
							<span>Alerting</span>
						</span>
					}
				>
					<NavItem label="Alerts" />
					<NavItem label="Rules" />
					<NavItem label="Destinations" />
				</Section>

				{/* Entities */}
				<Section
					title={
						<span className="flex items-center gap-2">
							<TagIcon />
							<span>Entities</span>
						</span>
					}
				>
					<NavLink
						label="Public Registry"
						href="/console/entities"
						path={path}
					/>
					<NavLink label="My Watchlist" href="/views/addresses" path={path} />
				</Section>

				{/* System */}
				<Section title="System">
					<NavItem label="Audit Log" />
					<NavItem label="Settings" />
				</Section>
			</nav>

			<Account member={member} />
		</aside>
	);
}
