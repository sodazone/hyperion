import { render } from "@/server/render";
import { CheckIcon, SadIcon } from "./components/icons";

export function MagicLinkSent({ succeeded }: { succeeded: boolean }) {
	if (succeeded) {
		return render(
			<div className="flex flex-col gap-6">
				<div className="mx-auto text-green-500 w-8">
					<CheckIcon />
				</div>
				<p className="text-sm text-zinc-200 text-center">
					We've sent you a magic link.
					<br />
					Check your email to continue.
				</p>
			</div>,
		);
	} else {
		return render(
			<div className="flex flex-col gap-6">
				<div className="mx-auto text-zinc-500 w-8">
					<SadIcon size={32} />
				</div>
				<p className="text-sm text-zinc-200 text-center">
					Oops! We couldn't send you a magic link.
					<br />
					Please try again later.
				</p>
			</div>,
		);
	}
}
