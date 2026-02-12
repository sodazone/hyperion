import { PUBLIC_OWNER } from "@/db";
import { equals } from "@/utils/bytes";

export function toOwners(
	owner: Uint8Array,
	includePublic = true,
): Uint8Array[] {
	return includePublic
		? equals(owner, PUBLIC_OWNER)
			? [PUBLIC_OWNER]
			: [PUBLIC_OWNER, owner]
		: [owner];
}
