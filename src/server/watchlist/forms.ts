import { hashOwner } from "@/auth";
import type { HyperionDB } from "@/db";
import { normalizeAddress } from "@/intel/mapping";
import type { AuthApi } from "../auth/stytch";
import { InternalServerError, Unauthorized } from "../response";
import { validateAddress } from "./validation";

export async function WatchlistDeleteHandler(
	{ authApi, db }: { db: HyperionDB; authApi: AuthApi },
	req: Bun.BunRequest<"/console/watchlist/:address">,
) {
	const user = await authApi.getAuthenticatedUser(req);
	if (!user) return Unauthorized;

	const address = req.params.address?.trim();
	if (!address)
		return Response.json({ error: "Missing address" }, { status: 400 });

	const owner = hashOwner(user.email);

	try {
		db.deleteEntity({ owner, address });
		return new Response(null, {
			headers: { "HX-Redirect": "/console/watchlist" },
			status: 200,
		});
	} catch (err) {
		console.error(err);
		return InternalServerError;
	}
}

export async function WatchlistPostHandler(
	{ authApi, db }: { db: HyperionDB; authApi: AuthApi },
	req: Bun.BunRequest,
) {
	const user = await authApi.getAuthenticatedUser(req);
	if (!user) return Unauthorized;

	const formData = await req.formData();
	const address = formData.get("address")?.toString();

	if (address === undefined || validateAddress(address)) {
		return new Response(
			`
        <div class="text-pink-400 text-sm mt-1">
          Address must be 10–100 characters and contain only letters, numbers, spaces, commas, dots, or hyphens.
        </div>
      `,
			{ headers: { contentType: "text/html" }, status: 200 },
		);
	}

	const timestamp = Date.now();
	const version = 0;
	const source = user.email;
	const owner = hashOwner(user.email);
	const normalizedAddress = normalizeAddress(address);

	const tagsRaw = formData.getAll("tags[][tag]");
	const networksRaw = formData.getAll("tags[][network]");
	const tags = tagsRaw.map((t, i) => ({
		tag: t.toString().trim(),
		network: Number(networksRaw[i]),
		timestamp,
		version,
		source,
	}));

	const categoriesRaw = formData.getAll("categories[][category]");
	const networksCatRaw = formData.getAll("categories[][network]");
	const categories = categoriesRaw.map((c, i) => ({
		category: Number(c),
		subcategory: 0,
		network: Number(networksCatRaw[i]),
		timestamp,
		version,
		source,
	}));

	try {
		db.deleteAllTags({ owner, address: normalizedAddress });
		db.deleteAllCategories({ owner, address: normalizedAddress });

		db.upsertEntities([
			{
				owner,
				address: normalizedAddress,
				address_formatted: address,
				tags,
				categories,
			},
		]);

		return new Response(null, {
			headers: { "HX-Redirect": "/console/watchlist" },
			status: 200,
		});
	} catch (err) {
		console.error(err);
		return InternalServerError;
	}
}
