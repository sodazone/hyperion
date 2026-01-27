const PLANCK_PER_DOT = 10_000_000_000n;

const DOLPHIN_MIN = 10_000n * PLANCK_PER_DOT; // 1e14
const WHALE_MIN = 100_000n * PLANCK_PER_DOT; // 1e15

export type BalanceClass = "whale" | "dolphin" | "fish" | "shrimp";

export function classifyPolkadotBalance(balance: string): BalanceClass {
	const value = BigInt(balance);

	if (value >= WHALE_MIN) return "whale";
	if (value >= DOLPHIN_MIN) return "dolphin";
	if (value >= PLANCK_PER_DOT * 1_000n) return "fish";
	return "shrimp";
}
