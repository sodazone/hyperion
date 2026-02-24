import type { RuleChannel } from "@/alerting";
import { EnabledBadge } from "@/console/components/badge.enabled";
import { ChevronRightIcon, PlusIcon } from "@/console/components/icons";
import { TopBar } from "@/console/components/top.bar";

export function ChannelList({ channels }: { channels: RuleChannel[] }) {
	return (
		<section className="flex flex-col min-h-0 max-w-full md:w-4xl lg:w-5xl md:mx-auto">
			<TopBar
				right={
					<button
						type="button"
						hx-get="/console/channels/form/__new__"
						hx-target="#main-content"
						hx-push-url="true"
						hx-swap="innerHTML swap:80ms"
						className="ui-btn"
					>
						<PlusIcon size={18} />
						<span>Add Channel</span>
					</button>
				}
				left={
					<h1 className="text-lg font-semibold text-zinc-200">
						Delivery Channels
					</h1>
				}
			/>

			<div className="space-y-2 mt-4">
				{channels.length === 0 && (
					<div className="px-4 py-16 text-center text-zinc-500 text-sm">
						No channels configured yet
					</div>
				)}

				{channels.map((c) => (
					<div
						key={c.id}
						hx-get={`/console/channels/form/${c.id}`}
						hx-target="#main-content"
						hx-push-url="true"
						className={`
							group cursor-pointer
							bg-zinc-950/40
							hover:bg-teal-900/10
							transition-colors
							px-4 py-3
							flex items-center justify-between
						`}
					>
						<div className="flex flex-col">
							<div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
								{c.name}
							</div>

							<div className="text-xs text-zinc-500 flex items-center gap-2">
								<span className="uppercase tracking-wide">{c.type}</span>
								<EnabledBadge enabled={c.enabled} />
							</div>
						</div>

						<div className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-sm">
							<ChevronRightIcon size={24} />
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
