import type { RuleChannel } from "@/alerting";
import { BackButton } from "@/console/components/btn.back";
import { Checkbox } from "@/console/components/checkbox";
import { ChevronUpDownIcon } from "@/console/components/icons";
import { TelegramChannelConfig } from "./channel.config";

function ChannelConfigPartial({
	type,
	config,
}: {
	type: string;
	config?: Record<string, any>;
}) {
	switch (type) {
		case "telegram":
			return <TelegramChannelConfig config={config} />;

		default:
			return null;
	}
}

export function ChannelForm({ channel }: { channel?: RuleChannel }) {
	const isEdit = !!channel;
	const method = isEdit ? "hx-put" : "hx-post";

	return (
		<section className="h-full min-h-screen flex flex-col max-w-full md:w-4xl lg:w-5xl md:mx-auto space-y-8">
			<div className="flex gap-6 items-center">
				<BackButton href="/console/channels" />
				<div className="flex flex-col space-y-1">
					<h1 className="text-lg font-semibold text-zinc-300">
						{isEdit ? "Edit Channel" : "New Channel"}
					</h1>
					<div className="text-sm text-zinc-500">
						Configure where alerts will be delivered.
					</div>
				</div>
				{isEdit && (
					<button
						type="button"
						hx-delete={`/console/channels/${channel?.id}`}
						hx-on:click="event.stopPropagation()"
						hx-confirm="Delete this channel?"
						className="ml-auto px-2"
					>
						<span className="text-zinc-400 hover:text-red-400 text-sm">
							Delete
						</span>
					</button>
				)}
			</div>

			<form
				{...{ [method]: "/console/channels" }}
				hx-target="#channel-error"
				hx-disable-elt="button[type=submit]"
				className="border border-zinc-900 p-6 rounded-md space-y-6"
			>
				{isEdit && <input type="hidden" name="id" value={channel?.id} />}

				{/* Error container */}
				<div id="channel-error" className="text-sm"></div>

				{/* Name */}
				<div className="flex flex-col gap-2">
					<label htmlFor="name" className="text-sm text-zinc-300">
						Channel Name <span className="text-pink-500">*</span>
					</label>
					<input
						required
						id="name"
						name="name"
						defaultValue={channel?.name}
						placeholder="channel name..."
						className="ui-input w-full px-2 py-1"
					/>
				</div>

				{/* Type */}
				<div className="flex flex-col gap-2">
					<label htmlFor="type" className="text-sm text-zinc-300">
						Channel Type <span className="text-pink-500">*</span>
					</label>

					<div className="ui-select">
						<select
							id="type"
							name="type"
							defaultValue={channel?.type}
							className="ui-input"
							hx-get="/console/channels/config"
							hx-trigger="change"
							hx-target="#channel-config"
							hx-include="closest form"
							required
						>
							<option value="">Select type...</option>
							<option value="telegram">Telegram</option>
						</select>
						<div className="ui-select-btn">
							<ChevronUpDownIcon />
						</div>
					</div>
				</div>

				{/* Dynamic config */}
				<div
					id="channel-config"
					hx-get="/console/channels/config"
					hx-trigger="change from:#type"
					hx-target="#channel-config"
					hx-include="closest form"
				>
					{channel?.type ? (
						<ChannelConfigPartial type={channel.type} config={channel.config} />
					) : (
						<div className="text-sm text-zinc-500">
							Select a channel type to configure it.
						</div>
					)}
				</div>

				{/* Enabled toggle */}
				<div className="flex flex-col gap-2 text-sm text-zinc-300">
					<Checkbox
						name="enabled"
						label="Enabled"
						defaultValue={channel?.enabled ?? true}
					/>
					<div className="text-xs text-zinc-400">
						Enable or disable channel.
					</div>
				</div>

				{/* Test */}
				<div className="flex items-center justify-between pt-2 border-t border-zinc-900">
					<button
						type="button"
						hx-post="/console/channels/test"
						hx-include="closest form"
						hx-target="#channel-test-result"
						hx-swap="innerHTML"
						className="text-sm px-3 py-2 bg-zinc-900 rounded-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
					>
						Send Test Message
					</button>

					<div id="channel-test-result" className="text-xs text-zinc-400"></div>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-2 pt-2">
					<a
						href="/console/channels"
						hx-get="/console/channels"
						hx-target="#main-content"
						className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
					>
						Cancel
					</a>

					<button type="submit" className="ui-btn">
						Save Channel
					</button>
				</div>
			</form>
		</section>
	);
}
