import { CAT, CategoriesMap } from "@/intel/mapping";

const CATEGORY_STYLE: Record<
	number,
	{
		className: string;
	}
> = {
	[CAT.CYBERCRIME]: {
		className: "border-amber-950/80 bg-amber-950/50",
	},

	[CAT.COMPROMISED]: {
		className: "border-amber-950/80 bg-amber-950/50",
	},

	[CAT.SANCTIONS]: {
		className: "border-amber-950/80 bg-amber-950/50",
	},

	[CAT.HIGH_RISK]: {
		className: "border-amber-950/80 bg-amber-950/50",
	},
};

const BASE_CLASS =
	"inline-flex items-center rounded-md px-2 py-0.5 text-xs border";

function getCategoryLabel(categoryCode: number, subcategoryCode?: number) {
	const category = CategoriesMap.getLabel(categoryCode);
	const sub = subcategoryCode
		? CategoriesMap.getLabel(categoryCode, subcategoryCode)
		: undefined;

	return sub ? `${category} ${sub}` : (category ?? "Unknown");
}

export function CategoryBadge({
	categoryCode,
	subcategoryCode,
}: {
	categoryCode: number;
	subcategoryCode?: number;
}) {
	const style =
		CATEGORY_STYLE[categoryCode]?.className ??
		"bg-zinc-900 border-zinc-800 text-zinc-200 truncate";

	const label = getCategoryLabel(categoryCode, subcategoryCode);

	return <span className={`${BASE_CLASS} ${style}`}>{label}</span>;
}
