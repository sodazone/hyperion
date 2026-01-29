import type { JSX } from "react";
import { Sidebar } from "./menu";

type Props = {
	path?: string;
	children: JSX.Element;
};

export function ConsoleApp({ path, children }: Props) {
	return (
		<html lang="en" className="h-full">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="stylesheet" href="/styles.css" />
				<title>Hyperion Console</title>
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
						<Sidebar path={path ?? "/"} />

						{/* Content Area */}
						<main
							id="main-panel"
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
