import { withAuth } from "@/console/authenticated";
import { InternalServerError, InvalidParameters } from "@/server/response";
import { safeString } from "@/utils/strings";

const RedirectToChannels = () =>
	new Response(null, {
		status: 200,
		headers: { "HX-Redirect": "/console/channels" },
	});

const FormErrors = () =>
	new Response(
		`<div class="text-pink-400 text-sm mt-1">
    <ul>
      Invalid paramaters
    </ul>
  </div>
  `,
		{ headers: { contentType: "text/html" }, status: 200 },
	);

function parseChannelForm(form: FormData) {
	const config: Record<string, string> = Object.create(null);

	const name = safeString(form.get("name"));
	const type = safeString(form.get("type"));

	if (!name || !type) {
		throw new Error("invalid parameters");
	}

	for (const [key, value] of form.entries()) {
		if (key.startsWith("config.")) {
			config[key.replace("config.", "")] = value;
		}
	}

	return {
		name,
		type,
		enabled: form.get("enabled") === "on",
		config,
	};
}

export const ChannelPutHandler = withAuth(async ({ db, req, ownerHash }) => {
	try {
		const formData = await req.formData();
		const data = parseChannelForm(formData);
		const id = Number(formData.get("id"));
		if (id === null || Number.isNaN(id)) {
			return InvalidParameters;
		}
		db.alerting.rules.updateChannel(
			{ id, owner: ownerHash },
			{
				...data,
			},
		);

		return RedirectToChannels();
	} catch {
		return FormErrors();
	}
});

export const ChannelPostHandler = withAuth(async ({ db, req, ownerHash }) => {
	try {
		const formData = await req.formData();
		const data = parseChannelForm(formData);

		db.alerting.rules.insertChannel({
			...data,
			owner: ownerHash,
		});

		return RedirectToChannels();
	} catch {
		return FormErrors();
	}
});

export const ChannelDeleteHandler = withAuth<"/console/channels/:id">(
	async ({ db, req, ownerHash }) => {
		try {
			const id = Number(req.params.id);

			if (id === undefined || Number.isNaN(id)) return InvalidParameters;

			db.alerting.rules.deleteChannel({
				id,
				owner: ownerHash,
			});

			return RedirectToChannels();
		} catch (error) {
			console.error(error);
			return InternalServerError;
		}
	},
);
