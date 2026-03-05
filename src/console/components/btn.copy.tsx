import { CopyIcon } from "./icons";

export function CopyButton({
	text,
	title,
	size = 16,
}: {
	text: string;
	title?: string;
	size?: number;
}) {
	return (
		<button
			type="button"
			hx-on:click={`
			    event.stopPropagation();
          const btn = this;
          navigator.clipboard.writeText('${text}');
          const old = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>';
          setTimeout(() => {
            btn.innerHTML = old;
          }, 1200);
        `}
			hx-swap="none"
			className="cursor-copy rounded-md p-1 text-zinc-600 hover:text-zinc-200 hover:bg-zinc-900 transition"
			title={title || "Copy"}
		>
			<CopyIcon size={size} />
		</button>
	);
}
