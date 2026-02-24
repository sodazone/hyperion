import { ConsoleApp } from "@/console/app";
import { withAuth } from "@/console/authenticated";
import { coerce } from "@/server/api/params";
import { render } from "@/server/render";
import { InvalidParameters, NotFound } from "@/server/response";
import { ChannelForm } from "./channel.form";
import { ChannelList } from "./channel.list";

export const ChannelFormPage = withAuth<"/console/channels/form/:id">(
	async ({ db, req, user, ownerHash }) => {
		let component: React.ReactElement | undefined;
		if (req.params.id === "__new__") {
			component = <ChannelForm />;
		} else {
			const id = coerce<number>(req.params.id);
			if (id === undefined || Number.isNaN(id)) {
				return InvalidParameters;
			}
			const channel = db.alerting.rules.getChannel({ id, owner: ownerHash });
			if (channel === null) {
				return NotFound;
			}
			component = <ChannelForm channel={channel} />;
		}

		if (component) {
			if (req.headers.get("HX-Request")) {
				return render(component);
			}
			return render(
				<ConsoleApp member={user} path="/console/channels">
					{component}
				</ConsoleApp>,
			);
		}

		return InvalidParameters;
	},
);

export const ChannelListPage = withAuth(
	async ({ db, user, req, ownerHash }) => {
		const channels = db.alerting.rules.findAllChannels({ owner: ownerHash });

		if (req.headers.get("HX-Request")) {
			return render(<ChannelList channels={channels} />);
		}

		return render(
			<ConsoleApp member={user} path="/console/channels">
				<ChannelList channels={channels} />
			</ConsoleApp>,
		);
	},
);
