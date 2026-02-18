const cexMap: Record<
	string,
	{ name: string; icon?: string | React.ReactNode }
> = {
	"binance.com": {
		name: "Binance",
		icon: (
			<img
				className="w-6 h-6 rounded-full"
				width={24}
				height={24}
				alt="Binance Logo"
				src="https://assets.coingecko.com/markets/images/52/standard/binance.jpg"
			/>
		),
	},
	"coinbase.com": {
		name: "Coinbase",
		icon: (
			<img
				className="w-6 h-6 rounded-full"
				width={24}
				height={24}
				alt="Coinbase Logo"
				src="https://assets.coingecko.com/markets/images/23/standard/Coinbase_Coin_Primary.png"
			/>
		),
	},
	"kraken.com": {
		name: "Kraken",
		icon: (
			<img
				className="w-6 h-6 rounded-full"
				width={24}
				height={24}
				alt="Kraken Logo"
				src="https://assets.coingecko.com/markets/images/29/standard/kraken.jpg"
			/>
		),
	},
	"huobi.com": { name: "Huobi", icon: "🔥" },
	"okx.com": { name: "OKX", icon: "🟣" },
	"ftx.com": { name: "FTX", icon: "🟠" },
};

const fallback = (name: string) => ({ name, icon: "❓" });

function resolveExchange(raw: string) {
	if (!raw) return { name: raw, icon: "" };
	const [, key] = raw.split("exchange_name:");
	const name = key?.toLowerCase() ?? "unknown";
	const resolved = cexMap[name] || fallback(name);
	return resolved;
}

export function ExchangeName({ tag }: { tag: string }) {
	const { icon, name } = resolveExchange(tag);
	return (
		<div className="inline-flex gap-2 items-center">
			{icon}
			<span>{name}</span>
		</div>
	);
}
