import type { HyperionDB } from "@/db";
import { getOwnerHashFromRequest } from "../auth/jwks";
import { InternalServerError, NotFound, Unauthorized } from "../response";
import { coerceCategoryParams, coerceCatetoryWriteParams } from "./params";

async function getCategory(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/private/category/:address/:cat/:subcat/:network">,
) {
	try {
		const ownerHash = await getOwnerHashFromRequest(req);
		if (ownerHash === null) return Unauthorized;

		const params = coerceCategoryParams(req.params);
		if (params instanceof Response) return params;

		const url = new URL(req.url);
		const exists = url.searchParams.get("exists") === "true";

		if (exists) {
			return new Response(null, {
				status: db.hasCategory({ ...params, owner: ownerHash }) ? 204 : 404,
			});
		}

		const entries = db.getCategories({
			...params,
			owner: ownerHash,
		});

		if (entries) {
			return Response.json(entries);
		} else {
			return NotFound;
		}
	} catch (err) {
		console.error("Route error:", err);
		return InternalServerError;
	}
}

async function postCategory(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/private/category/:address/:cat/:subcat/:network">,
) {
	const ownerHash = await getOwnerHashFromRequest(req);
	if (ownerHash === null) return Unauthorized;

	const params = coerceCatetoryWriteParams(req.params);
	if (params instanceof Response) return params;

	const body = await req.json();
	if (body instanceof Response) return body;

	const result = await db.putCategory({ ...params, owner: ownerHash }, body);

	return Response.json(result);
}

async function deleteCategory(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/private/category/:address/:cat/:subcat/:network">,
) {
	const ownerHash = await getOwnerHashFromRequest(req);
	if (ownerHash === null) return Unauthorized;

	const params = coerceCatetoryWriteParams(req.params);
	if (params instanceof Response) return params;

	const result = await db.deleteCategory({
		...params,
		owner: ownerHash,
	});

	return Response.json(result);
}

export const owned = {
	getCategory,
	postCategory,
	deleteCategory,
};
