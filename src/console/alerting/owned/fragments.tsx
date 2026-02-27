import { withAuth } from "@/console/authenticated";
import { Multiselect } from "@/console/components/select.multi";
import { render } from "@/server/render";

export const TagsFragment = withAuth<"/console/entities/tags/options">(
	async ({ db, req, ownerHash }) => {
		const params = new URL(req.url).searchParams;
		const selectedRaw = params.getAll("selected");
		const selected = selectedRaw.length ? selectedRaw : [];

		const tags = db.entities.findAllTags({
			owner: ownerHash,
		});

		return render(
			<div id="tags-multiselect">
				<Multiselect
					name="tags"
					placeholder="Select tags…"
					options={tags.map((t) => ({
						label: t,
						value: t,
					}))}
					selected={selected}
				/>
			</div>,
		);
	},
);
