export const formatNumberSI = (n: number, digits = 2) => {
	const abs = Math.abs(n);
	if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(digits)}B`;
	if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(digits)}M`;
	if (abs >= 1_000) return `${(n / 1_000).toFixed(digits)}K`;
	return n.toFixed(digits);
};

export const toDecimal = ({
	amount,
	decimals,
}: {
	amount: string | number | bigint;
	decimals: number;
}) => Number(amount) / 10 ** decimals;
