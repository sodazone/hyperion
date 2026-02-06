import { type HyperionDB, PUBLIC_OWNER } from "@/db";
import { analyzeAddress, analyzeAddressAllNetworks } from "@/intel/api";
import { InternalServerError, InvalidParameters, NotFound } from "../response";
import { owned } from "./owned";
import {
	coerceCategoryParams,
	coerceNetworkId,
	coerceTagParams,
} from "./params";

function getAddressByNetwork(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/public/address/:address/:network">,
) {
	try {
		const { address, network } = req.params;
		const networkId = coerceNetworkId(network);
		if (!address || networkId === undefined) {
			return InvalidParameters;
		}

		if (
			!db.entities.hasEntity({
				owner: PUBLIC_OWNER,
				address,
			})
		) {
			return NotFound;
		}

		const result = analyzeAddress(db, address, networkId);
		return Response.json(result);
	} catch (err) {
		console.error(err);
		return InternalServerError;
	}
}

function getAddressAllNetworks(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/public/address/:address">,
) {
	try {
		const { address } = req.params;
		const result = analyzeAddressAllNetworks(db, address);
		return Response.json(result);
	} catch (err) {
		console.error(err);
		return InternalServerError;
	}
}

function getAddressCategory(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/public/category/:address/:cat/:subcat/:network">,
) {
	try {
		const params = coerceCategoryParams(req.params);
		if (params instanceof Response) return params;

		const url = new URL(req.url);
		const exists = url.searchParams.get("exists") === "true";

		if (exists) {
			return new Response(null, {
				status: db.entities.hasCategory(params) ? 204 : 404,
			});
		}

		const entries = db.entities.findCategories(params);

		if (!entries || entries.length === 0) {
			return NotFound;
		}

		return Response.json(entries);
	} catch (err) {
		console.error("Route error:", err);
		return InternalServerError;
	}
}

function getAddressTags(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/public/tags/:address/:network">,
) {
	try {
		const { address, network } = req.params;
		const networkId = coerceNetworkId(network);
		if (!address || networkId === undefined) {
			return InvalidParameters;
		}

		const entries = db.entities.findTags({
			owner: PUBLIC_OWNER,
			address,
			network: networkId,
		});

		if (entries === undefined || entries.length === 0) {
			return NotFound;
		}

		return Response.json(entries);
	} catch (err) {
		console.error("Route error:", err);
		return InternalServerError;
	}
}

function getAddressTagByNetwork(
	db: HyperionDB,
	req: Bun.BunRequest<"/v1/public/tag/:address/:tag/:network">,
) {
	try {
		const params = coerceTagParams(req.params);
		if (params instanceof Response) return params;

		const url = new URL(req.url);
		const exists = url.searchParams.get("exists") === "true";

		if (exists) {
			return new Response(null, {
				status: db.entities.hasTag(params) ? 204 : 404,
			});
		}

		const result = db.entities.findTags(params);

		if (result === undefined) {
			return NotFound;
		}

		return Response.json(result);
	} catch (err) {
		console.error("Route error:", err);
		return InternalServerError;
	}
}

export const intel = {
	getAddressByNetwork,
	getAddressAllNetworks,
	getAddressCategory,
	getAddressTags,
	getAddressTagByNetwork,
	owned,
};
