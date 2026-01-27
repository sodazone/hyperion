import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { AddressAnalysis } from "@/intel/api/types";
import type { Serve } from "@/server/serve";
import { createTestJWT } from "./auth";
import { withTestData } from "./fixture";
import { fetchAuth, get, runTestServer } from "./helpers";

describe("Hyperion API v1", () => {
	let srv: Serve;
	let token: string;

	beforeAll(async () => {
		srv = await runTestServer();
		withTestData(srv);
		token = await createTestJWT("did:test|user");
	});

	afterAll(async () => {
		await srv.shutdown("SIGINT");
	});

	/**
	 * System
	 */

	it("GET / returns version string", async () => {
		const { status, json } = await get("/");
		expect(status).toBe(200);
		expect(json).toContain("Hyperion API v");
	});

	it("GET /uptime returns uptime info", async () => {
		const { status, json } = await get<{ uptime: number; ok: boolean }>(
			"/uptime",
		);
		expect(status).toBe(200);
		expect(json).not.toBeNull();

		if (json) {
			expect(json.ok).toBe(true);
			expect(typeof json.uptime).toBe("number");
		}
	});

	/**
	 * Metadata
	 */

	it("GET /v1/meta/networks returns network map", async () => {
		const { status, json } =
			await get<Record<string, number>>("/v1/meta/networks");

		expect(status).toBe(200);
		expect(json).not.toBeNull();

		if (json) {
			expect(typeof json).toBe("object");
			expect(Object.keys(json).length).toBeGreaterThan(0);
		}
	});

	it("GET /v1/meta/categories returns category list", async () => {
		const { status, json } = await get("/v1/meta/categories");

		expect(status).toBe(200);
		expect(Array.isArray(json)).toBe(true);
	});

	/**
	 * Authentication
	 */

	it("GET /v1/private/me fails without auth", async () => {
		const { status } = await get("/v1/private/me");
		expect(status).toBe(401);
	});

	it("GET /v1/private/me succeeds with auth", async () => {
		const { status, json } = await fetchAuth<{ hash: string }>(
			"/v1/private/me",
			token,
		);

		expect(status).toBe(200);
		expect(json).not.toBeNull();

		if (json) {
			expect(json.hash).toHaveLength(64);
		}
	});

	it("GET /v1/private/category/:address/:cat/:subcat/:network", async () => {
		const { status } = await fetchAuth(
			"/v1/private/category/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA/2/1/1?exists=true",
			token,
		);

		expect(status).toBe(204);
	});

	it("POST /v1/private/category/:address/:cat/:subcat/:network", async () => {
		const { status } = await fetchAuth(
			"/v1/private/category/15PFPYwGMXeMMCXf5KZZqPZLDak9LHZb3bWXHqnAFe2fSGtq/5/2/2",
			token,
			{ method: "POST", body: { name: "Test Category" } },
		);

		expect(status).toBe(200);

		const { status: statusGet, json } = await fetchAuth(
			"/v1/private/category/15PFPYwGMXeMMCXf5KZZqPZLDak9LHZb3bWXHqnAFe2fSGtq/5/2/2",
			token,
		);

		expect(statusGet).toBe(200);
		expect(json).not.toBeNull();

		const { status: statusDelete } = await fetchAuth(
			"/v1/private/category/15PFPYwGMXeMMCXf5KZZqPZLDak9LHZb3bWXHqnAFe2fSGtq/5/2/2",
			token,
			{ method: "DELETE" },
		);

		expect(statusDelete).toBe(200);

		const { status: statusGetAfterDelete, json: jsonAfterDelete } =
			await fetchAuth<[]>(
				"/v1/private/category/15PFPYwGMXeMMCXf5KZZqPZLDak9LHZb3bWXHqnAFe2fSGtq/5/2/2",
				token,
			);

		expect(statusGetAfterDelete).toBe(200);
		expect(jsonAfterDelete).not.toBeNull;
		if (jsonAfterDelete) {
			expect(jsonAfterDelete.length).toBe(0);
		}
	});

	/**
	 * Address analysis
	 */

	it("GET /v1/public/address/:address returns analysis across networks", async () => {
		const { status, json } = await get<{
			address: string;
			networks: { networkId: number; analysis: AddressAnalysis }[];
		}>("/v1/public/address/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA");

		expect(status).toBe(200);
		expect(json).not.toBeNull();

		if (json) {
			expect(typeof json.address).toBe("string");
			expect(Array.isArray(json.networks)).toBe(true);
			expect(json.networks.length).toBeGreaterThan(0);
			expect(json.networks[0]?.networkId).toBe(1);
			expect(json.networks[0]?.analysis.attribution.length).toBe(2);
		}
	});

	it("GET /v1/public/address/:address/:network returns analysis", async () => {
		const { status } = await get(
			"/v1/public/address/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA/1",
		);

		expect(status).toBe(200);
	});

	it("GET /v1/public/address/:address/:network returns 404 when address not found", async () => {
		const { status } = await get("/v1/public/address/0xABC123/1");

		expect(status).toBe(404);
	});

	/**
	 * Categories
	 */

	it("GET /v1/public/category returns 404 when no categories", async () => {
		const { status } = await get("/v1/public/category/abcd/0/0/0");

		expect(status).toBe(404);
	});

	it("GET /v1/public/category with exists=true returns 204", async () => {
		const { status } = await get(
			"/v1/public/category/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA/0/0/0?exists=true",
		);

		expect(status).toBe(204);
	});

	/**
	 * Tags
	 */

	it("GET /v1/public/tags returns 404 when no tags", async () => {
		const { status } = await get("/v1/public/tags/abcd/1");

		expect(status).toBe(404);
	});

	it("GET /v1/public/tag/:address/:tag/:network returns 204 when exists=true", async () => {
		const { status } = await get(
			"/v1/public/tag/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA/phishing-domain:example.com/1?exists=true",
		);

		expect(status).toBe(204);
	});

	it("GET /v1/public/tag/:address/:tag/:network returns 404 when tag not found", async () => {
		const { status } = await get(
			"/v1/public/tag/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA/not-found-tag/1?exists=true",
		);

		expect(status).toBe(404);
	});
});
