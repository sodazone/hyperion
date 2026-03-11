import type { RuleChannel } from "@/alerting";
import { withAuth } from "@/console/authenticated";
import { Multiselect } from "@/console/components/select.multi";
import { render } from "../../../server/render";
import { CHANNEL_TYPES, ChannelConfigPartial } from "./channel.form";

function ChannelOptions({
	channels,
	url,
}: {
	channels: RuleChannel[];
	url: string;
}) {
	if (!channels.length) {
		return (
			<div className="text-sm text-zinc-500">
				No channels yet. Create one in the{" "}
				<span className="font-medium text-zinc-200">Channels</span> section
				first.
			</div>
		);
	}

	const params = new URL(url).searchParams;
	const defaultValue = params.get("s");

	return (
		<div id="channels-selector">
			<Multiselect
				name="channelIds"
				placeholder="Select channels…"
				options={channels.map((c) => ({
					label: c.name,
					value: c.id,
				}))}
				selected={defaultValue ? defaultValue.split(",") : undefined}
			/>
		</div>
	);
}

export const ChannelsFragment = withAuth<"/console/channels/options">(
	async ({ db, req, ownerHash }) => {
		const channels = db.alerting.rules.findAllChannels({
			owner: ownerHash,
			enabled: true,
		});

		return render(<ChannelOptions channels={channels} url={req.url} />);
	},
);

export const ChannelsConfigFragment = withAuth<"/console/channels/config">(
	async ({ req }) => {
		const url = new URL(req.url);
		const type = url.searchParams.get("type");

		if (type && CHANNEL_TYPES.includes(type)) {
			return render(<ChannelConfigPartial type={type} />);
		}

		return render(
			<div className="text-sm text-zinc-500">
				Select a channel type to configure it
			</div>,
		);
	},
);
