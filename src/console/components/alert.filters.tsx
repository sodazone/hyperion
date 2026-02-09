import { NetworkCache } from "../network.cache";
import { SearchFilters } from "./filters";

export type Filters = {
	networkId?: string;
	severity?: string;
};

type Props = {
	path: string;
	filters: Filters;
};

export function AlertSearchFilters({ path, filters }: Props) {
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
					name: "severity",
					default: "*",
					options: [
						{ label: "Any Severity", value: "*" },
						{ label: "Critical", value: "3" },
						{ label: "Warning", value: "2" },
						{ label: "Info", value: "1" },
					],
				},
			]}
		/>
	);
}
