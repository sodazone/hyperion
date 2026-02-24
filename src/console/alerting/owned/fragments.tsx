import { withAuth } from "@/console/authenticated";
import { Multiselect } from "@/console/components/select.multi";
import { render } from "@/server/render";

export const TagsFragment = withAuth<"/console/entities/tags/options">(
	async ({ db, ownerHash }) => {
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
				/>
				<script>{`document.querySelectorAll("#tags-multiselect .multiselect").forEach(initMultiselect);`}</script>
			</div>,
		);
	},
);
