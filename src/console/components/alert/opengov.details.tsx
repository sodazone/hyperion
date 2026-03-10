import type { OpenGovAlertPayload } from "@/alerting/rules/templates/opengov/rule";

export function OpenGovAlertDetails({ payload }: { payload: unknown }) {
	const p = payload as OpenGovAlertPayload;
	if (p.link === undefined) return null;
	return (
		<div className="flex gap-2 items-center">
			<span className="text-zinc-500 w-16 capitalize">Proposal</span>
			<a
				href={p.link}
				target="_blank"
				rel="noopener noreferrer"
				className="truncate hover:text-zinc-100 underline"
				title={p.link}
			>
				{p.link}
			</a>
		</div>
	);
}
