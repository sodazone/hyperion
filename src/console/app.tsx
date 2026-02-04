import type { JSX } from "react";
import type { Member } from "@/auth/types";
import { Sidebar } from "./menu";

type Props = {
	path?: string;
	member?: Member | null;
	children: JSX.Element;
};

export function ConsoleApp({ member, children }: Props) {
	return (
		<html lang="en" className="h-full">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="icon" type="image/svg+xml" href="/img/favicon.svg" />
				<link rel="icon" type="image/png" href="/img/favicon.png" />
				<title>Hyperion Console</title>
				<link rel="stylesheet" href="/styles.css" />
				<script
					src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js"
					integrity="sha384-/TgkGk7p307TH7EXJDuUlgG3Ce1UVolAOFopFekQkkXihi5u/6OCvVKyz1W+idaz"
					crossOrigin="anonymous"
				></script>
			</head>
			<body className="h-full bg-zinc-950 text-zinc-100">
				<div className="flex h-full flex-col">
					{/* Main */}
					<div className="flex flex-1 overflow-hidden">
						<Sidebar member={member} />

						{/* Content Area */}
						<main
							id="main-content"
							className="flex flex-1 flex-col overflow-hidden"
						>
							{children}
						</main>
					</div>
				</div>
			</body>
		</html>
	);
}
