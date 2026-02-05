import { CAT, CategoriesMap } from "@/intel/mapping";

const CATEGORY_STYLE: Record<
	number,
	{
		className: string;
		priority: number;
	}
> = {
	[CAT.CYBERCRIME]: {
		className: "bg-rose-500/10 text-rose-300 border-rose-500/30",
		priority: 100,
	},

	[CAT.COMPROMISED]: {
		className: "bg-rose-400/10 text-rose-300 border-rose-400/25",
		priority: 95,
	},

	[CAT.SANCTIONS]: {
		className: "bg-amber-400/10 text-amber-300 border-amber-400/25",
		priority: 90,
	},

	[CAT.HIGH_RISK]: {
		className: "bg-orange-400/10 text-orange-300 border-orange-400/25",
		priority: 75,
	},

	[CAT.ANONYMIZING]: {
		className: "bg-indigo-400/10 text-indigo-300 border-indigo-400/25",
		priority: 70,
	},

	[CAT.REGULATORY]: {
		className: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
		priority: 60,
	},
};

const BASE_CLASS =
	"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border";

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
		"bg-slate-400/10 text-slate-300 border-slate-400/20 truncate";

	const label = getCategoryLabel(categoryCode, subcategoryCode);

	return <span className={`${BASE_CLASS} ${style}`}>{label}</span>;
}
