import type { RuleDefinition } from "@/alerting";
import { BackButton } from "@/console/components/btn.back";
import { RuleIcons } from "@/console/components/rule.icons";

export function TemplateWizard({
	templates,
}: {
	templates: RuleDefinition<any, any, any>[];
}) {
	if (!templates.length) {
		return (
			<p className="text-zinc-500 text-center py-12 text-sm">
				No templates available
			</p>
		);
	}

	return (
		<div className="h-full min-h-screen flex flex-col max-w-full md:w-4xl lg:w-5xl md:mx-auto space-y-8">
			<div className="flex gap-6 items-center">
				<BackButton href="/console/rules" />

				<h1 className="text-lg font-semibold text-zinc-300">Templates</h1>
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				{templates.map((t) => (
					<div
						key={t.id}
						className="bg-zinc-900/80 p-4 md:rounded-lg shadow-md"
					>
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-4">
								<div className="w-10 h-10 bg-teal-700/70 flex items-center rounded-md justify-center">
									<span className="w-6 h-6">{RuleIcons[t.id]}</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="font-semibold text-zinc-100">{t.title}</span>
									<span className="text-zinc-600 text-xs uppercase">
										{t.id}
									</span>
								</div>
							</div>
							{t.description && (
								<p className="text-zinc-300 text-sm">{t.description}</p>
							)}

							<button
								type="button"
								className="w-full ui-btn"
								hx-get={`/console/rules/form/__new__?template=${t.id}`}
								hx-target="#main-content"
								hx-swap="innerHTML swap:80ms"
							>
								<span className="w-full text-center">Create Alert</span>
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
