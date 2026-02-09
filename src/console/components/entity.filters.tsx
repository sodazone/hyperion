import { topLevelCategories } from "@/intel/mapping";
import { NetworkCache } from "../network.cache";
import { SearchFilters } from "./filters";

export type Filters = {
	q?: string;
	networkId?: string;
	category?: string;
};

type Props = {
	path: string;
	filters: Filters;
};

export function EntitySearchFilters({ path, filters }: Props) {
	return (
		<SearchFilters
			path={path}
			values={filters}
			defs={[
				{
					type: "search",
					name: "q",
					placeholder: "Search address...",
				},
				{
					type: "select",
					name: "networkId",
					default: "*",
					options: [
						{ label: "All Networks", value: "*" },
						...NetworkCache.all().map((n) => ({
							label: n.name,
							value: n.id.toString(),
						})),
					],
				},
				{
					type: "select",
					name: "category",
					default: "*",
					options: [
						{ label: "All Categories", value: "*" },
						...topLevelCategories.map((c) => ({
							label: c.label,
							value: c.category.toString(),
						})),
					],
				},
			]}
		/>
	);
}
