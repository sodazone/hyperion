export const safe = (v: any) =>
	v === undefined || v === null ? "" : String(v);
export const safeNumber = (v: any, fallback: number | null = null) => {
	if (v === null || v === undefined) return fallback;

	const n = typeof v === "number" ? v : Number(v);

	return Number.isFinite(n) ? n : fallback;
};
