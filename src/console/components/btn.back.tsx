import { ChevronLeftIcon } from "./icons";

export function BackButton({ href }: { href: string }) {
	return (
		<button
			type="button"
			hx-get={href}
			hx-target="#main-content"
			hx-push-url="true"
			hx-on:click={`
              const referrer = document.referrer;
              const origin = window.location.origin;
              const prevPath = referrer.startsWith(origin) ? new URL(referrer).pathname : '';
              if (prevPath.startsWith('${href}')) {
                window.history.back();
                event.preventDefault();
              }
            `}
			className="inline-flex items-center gap-1  text-zinc-400 hover:text-zinc-200"
		>
			<ChevronLeftIcon size={24} /> <span>Back</span>
		</button>
	);
}
