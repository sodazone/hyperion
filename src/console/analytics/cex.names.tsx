const cexMap: Record<string, { name: string; icon?: string }> = {
	"binance.com": {
		name: "Binance",
		icon: "https://assets.coingecko.com/markets/images/469/large/Binance.png",
	},
	"binance us": {
		name: "Binance US",
		icon: "https://assets.coingecko.com/markets/images/469/large/Binance.png",
	},
	"coinbase.com": {
		name: "Coinbase",
		icon: "https://assets.coingecko.com/markets/images/23/standard/Coinbase_Coin_Primary.png",
	},
	"kraken.com": {
		name: "Kraken",
		icon: "https://assets.coingecko.com/markets/images/29/standard/kraken.jpg",
	},
	"gate.io": {
		name: "Gate.io",
		icon: "https://assets.coingecko.com/markets/images/60/large/Frame_1.png",
	},
	"bybit.com": {
		name: "Bybit",
		icon: "https://assets.coingecko.com/markets/images/698/large/bybit_spot.png",
	},
	"bitfinex.com": {
		name: "Bitfinex",
		icon: "https://assets.coingecko.com/markets/images/4/large/BItfinex.png",
	},
	"bitget.com": {
		name: "Bitget",
		icon: "https://assets.coingecko.com/markets/images/540/large/2023-07-25_21.47.43.jpg",
	},
	"kucoin.com": {
		name: "KuCoin",
		icon: "https://assets.coingecko.com/coins/images/1047/standard/sa9z79.png",
	},
	hitbtc: {
		name: "HitBTC",
		icon: "https://assets.coingecko.com/markets/images/24/large/hitbtc.png",
	},
	"nexo.io": {
		name: "Nexo",
		icon: "https://assets.coingecko.com/coins/images/3695/standard/CG-nexo-token-200x200_2x.png",
	},
	bitstamp: {
		name: "Bitstamp",
		icon: "https://assets.coingecko.com/markets/images/9/large/bitstamp.jpg",
	},
	"mexc global": {
		name: "MEXC",
		icon: "https://assets.coingecko.com/markets/images/409/large/logo_new.png",
	},
	"huobi.com": { name: "Huobi" },
	"okx.com": { name: "OKX" },
	"ftx.com": { name: "FTX" },
};

const fallback = (name: string) => ({ name, icon: "" });

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
			{icon && <img src={icon} alt={name} className="w-4 h-4 rounded-full" />}
			<span>{name}</span>
		</div>
	);
}
