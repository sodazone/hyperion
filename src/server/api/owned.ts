import type { HyperionDB } from "@/db";
import { InternalServerError, NotFound } from "../response";
import { coerceCategoryParams, coerceCatetoryWriteParams } from "./params";

async function getCategory(
	ownerHash: Uint8Array,
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/private/category/:address/:cat/:subcat/:network">,
) {
	try {
		const params = coerceCategoryParams(req.params);
		if (params instanceof Response) return params;

		const url = new URL(req.url);
		const exists = url.searchParams.get("exists") === "true";

		if (exists) {
			return new Response(null, {
				status: db.entities.hasCategory({ ...params, owner: ownerHash })
					? 204
					: 404,
			});
		}

		const entries = db.entities.findCategories({
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
	ownerHash: Uint8Array,
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/private/category/:address/:cat/:subcat/:network">,
) {
	const params = coerceCatetoryWriteParams(req.params);
	if (params instanceof Response) return params;

	const body = await req.json();
	if (body instanceof Response) return body;

	const result = db.entities.upsertCategory({
		...params,
		raw: body,
		owner: ownerHash,
	});

	return Response.json(result);
}

async function deleteCategory(
	ownerHash: Uint8Array,
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/private/category/:address/:cat/:subcat/:network">,
) {
	const params = coerceCatetoryWriteParams(req.params);
	if (params instanceof Response) return params;

	const result = db.entities.deleteCategory({
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
