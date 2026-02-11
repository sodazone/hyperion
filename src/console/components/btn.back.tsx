import { ArrowLeftStroke } from "./icons";

export function BackButton({ href }: { href: string }) {
	return (
		<button
			title="Go back"
			type="button"
			hx-get={href}
			hx-target="#main-content"
			hx-push-url="true"
			hx-swap="innerHTML swap:80ms"
			className="inline-flex items-center gap-1  text-zinc-400 hover:text-zinc-200 pr-2 py-2"
		>
			<ArrowLeftStroke size={28} />
		</button>
	);
}
