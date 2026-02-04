import type { Member } from "@/auth/types";
import { BellIcon, TagIcon } from "./components/icons";

type Props = {
  member?: Member | null;
};

export function Sidebar({ member }: Props) {
  const authenticated = !!member;

  return (
    <aside
      id="sidebar"
      className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950"
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-800 h-18">
        <div className="flex items-center justify-center">
          <a href="/">
            <img src="/img/logo.svg" alt="Hyperion Logo" className="h-8 w-8" />
          </a>
        </div>
        <div>
          <a className="flex flex-col" href="/">
            <span className="text-sm font-semibold tracking-wide">
              Hyperion
            </span>
            <span className="text-xs text-zinc-500">Intelligence Console</span>
          </a>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-3 py-4 space-y-6 text-sm">
        {/* Alerting */}
        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <BellIcon />
            <span>Alerting</span>
          </h3>
          <ul className="space-y-1">
            <li
              className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
              data-href="/console/alerts"
              hx-get="/console/alerts"
              hx-target="#main-content"
              hx-push-url="true"
            >
              Alerts
            </li>
            {authenticated && (
              <>
                <li
                  className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
                  data-href="/console/rules"
                  hx-get="/console/rules"
                  hx-target="#main-content"
                  hx-push-url="true"
                >
                  Rules
                </li>
                <li
                  className="nav-link flex items-center gap-3 rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
                  data-href="/console/destinations"
                  hx-get="/console/destinations"
                  hx-target="#main-content"
                  hx-push-url="true"
                >
                  Destinations
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Entities */}
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
              >
                My Watchlist
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Account */}
      <div className="border-t border-zinc-800 p-4">
        {!authenticated ? (
          <a
            href="/login"
            className="block w-full rounded-md border border-zinc-800 px-3 py-1.5 text-center text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          >
            Sign in
          </a>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                {member.name?.[0] ?? member.email?.[0] ?? "?"}
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-zinc-200 truncate">
                  {member.name ?? member.email}
                </span>
                {member.name && (
                  <span className="text-xs text-zinc-500 truncate">
                    {member.email}
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

      {/* Sidebar active link script */}
      <script>
        {`
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
          `}
      </script>
    </aside>
  );
}
