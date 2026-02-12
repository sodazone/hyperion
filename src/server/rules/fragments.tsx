import { withAuth } from "@/console/authenticated";
import { Multiselect } from "@/console/components/multiselect";
import { render } from "../render";

export const TagsFragment = withAuth<"/console/rules/fragments/tags">(
	async ({ db, ownerHash }) => {
		const tags = db.entities.findAllTags({
			owner: ownerHash,
		});

		return render(
			<div id="tags-multiselect">
				<Multiselect
					name="tags"
					placeholder="Search tags…"
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
