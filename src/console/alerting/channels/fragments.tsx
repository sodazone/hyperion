import type { RuleChannel } from "@/alerting";
import { withAuth } from "@/console/authenticated";
import { Multiselect } from "@/console/components/select.multi";
import { render } from "../../../server/render";
import { TelegramChannelConfig } from "./channel.config";

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
				No channels yet.
				<a
					href="/console/channels/form/__new__"
					hx-get="/console/channels/form/__new__"
					hx-target="#main-content"
					className="ml-2 text-zinc-200 underline"
				>
					Create one
				</a>
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

const CHANNEL_TYPES: string[] = ["telegram"] as const;

export const ChannelsConfigFragment = withAuth<"/console/channels/config">(
	async ({ req }) => {
		const url = new URL(req.url);
		const type = url.searchParams.get("type");

		if (type && CHANNEL_TYPES.includes(type)) {
			return render(<TelegramChannelConfig />);
		}

		return render(<div>Select a channel type to configure it</div>);
	},
);
