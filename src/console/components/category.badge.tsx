import { CAT, CategoriesMap } from "@/intel/mapping";

const CATEGORY_STYLE: Record<
	number,
	{
		className: string;
	}
> = {
	// Threat & Security
	[CAT.CYBERCRIME]: {
		className: "border-amber-950/80 bg-amber-950/50",
	},
	[CAT.COMPROMISED]: {
		className: "border-amber-950/80 bg-amber-950/50",
	},
	[CAT.HIGH_RISK]: {
		className: "border-amber-950/80 bg-amber-950/50",
	},
	[CAT.SANCTIONS]: {
		className: "border-red-950/80 bg-red-950/50",
	},
	[CAT.ANONYMIZING]: {
		className: "border-orange-950/80 bg-orange-950/50",
	},

	// DeFi, Yield & Assets
	[CAT.DEFI]: {
		className: "border-emerald-950/80 bg-emerald-950/50",
	},
	[CAT.YIELD_REWARDS]: {
		className: "border-emerald-950/80 bg-emerald-950/50",
	},
	[CAT.RWA_TREASURY]: {
		className: "border-emerald-950/80 bg-emerald-950/50",
	},

	// Exchanges & Institutional
	[CAT.EXCHANGE]: {
		className: "border-blue-950/80 bg-blue-950/50",
	},
	[CAT.FIAT_GATEWAY]: {
		className: "border-blue-950/80 bg-blue-950/50",
	},
	[CAT.OTC]: {
		className: "border-slate-800 bg-slate-900/50",
	},
	[CAT.PRIME_BROKERAGE]: {
		className: "border-slate-800 bg-slate-900/50",
	},
	[CAT.SERVICES]: {
		className: "border-slate-800 bg-slate-900/50",
	},

	// Infrastructure & Automation
	[CAT.INFRASTRUCTURE]: {
		className: "border-cyan-950/80 bg-cyan-950/50",
	},
	[CAT.AUTOMATED]: {
		className: "border-sky-950/80 bg-sky-950/50",
	},
	[CAT.VAULT_MPC]: {
		className: "border-zinc-800 bg-zinc-900/50",
	},

	// Identity & Compliance
	[CAT.IDENTIFIED]: {
		className: "border-teal-950/80 bg-teal-950/50",
	},
	[CAT.REGULATORY]: {
		className: "border-teal-950/80 bg-teal-950/50",
	},

	// Gaming & Entertainment
	[CAT.GAMBLING]: {
		className: "border-purple-950/80 bg-purple-950/50",
	},
	[CAT.NFT_GAMING]: {
		className: "border-indigo-950/80 bg-indigo-950/50",
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
