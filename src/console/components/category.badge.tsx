import { CAT, CategoriesMap } from "@/intel/mapping";

const CATEGORY_STYLE: Record<
	number,
	{
		className: string;
		priority: number;
	}
> = {
	[CAT.CYBERCRIME]: {
		className: "bg-red-950 text-red-300",
		priority: 100,
	},

	[CAT.COMPROMISED]: {
		className: "bg-rose-950 text-rose-300",
		priority: 95,
	},

	[CAT.SANCTIONS]: {
		className: "bg-amber-950 text-amber-400",
		priority: 90,
	},

	[CAT.HIGH_RISK]: {
		className: "bg-orange-950 text-orange-400",
		priority: 75,
	},

	[CAT.ANONYMIZING]: {
		className: "bg-indigo-950 text-indigo-400",
		priority: 70,
	},

	[CAT.REGULATORY]: {
		className: "bg-emerald-950 text-emerald-300",
		priority: 60,
	},

	[CAT.AUTOMATED]: {
		className: "bg-purple-950 text-purple-400",
		priority: 50,
	},

	[CAT.EXCHANGE]: {
		className: "bg-teal-950 text-teal-400",
		priority: 50,
	},
};

const BASE_CLASS =
	"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";

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
		"bg-zinc-950 text-zinc-300 truncate";

	const label = getCategoryLabel(categoryCode, subcategoryCode);

	return <span className={`${BASE_CLASS} ${style}`}>{label}</span>;
}
