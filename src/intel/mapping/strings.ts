export function sanitize(str: string): string | undefined {
	const d = str.trim().toLowerCase();
	if (!d) return;

	const cleaned = d.replace(/[^a-z0-9.-]/g, "");

	if (cleaned.length === 0 || cleaned.length > 255) return;

	return cleaned;
}
