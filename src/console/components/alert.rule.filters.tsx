import { SearchFilters } from "./filters";

export type Filters = {
	template?: string;
	enabled?: string;
};

type Props = {
	path: string;
	filters: Filters;
};

export function RuleSearchFilters({ path, filters }: Props) {
	return (
		<SearchFilters
			path={path}
			values={filters}
			defs={[
				{
					type: "search",
					name: "q",
					placeholder: "Search rule template...",
				},
			]}
		/>
	);
}
