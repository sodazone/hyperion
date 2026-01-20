import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Serve } from "@/server/serve";
import { createTestJWT } from "./auth";
import { get, getAuth, runTestServer } from "./helpers";

describe("Hyperion API v1", () => {
	let srv: Serve;

	beforeAll(async () => {
		srv = await runTestServer();
		// TODO: seed test data if needed
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
			expect(Object.keys(json).length).toBeGreaterThanOrEqual(0);
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
		const token = await createTestJWT("did:test|user");

		const { status, json } = await getAuth<{ hash: string }>(
			"/v1/private/me",
			token,
		);

		expect(status).toBe(200);
		expect(json).not.toBeNull();

		if (json) {
			expect(json.hash).toHaveLength(64); // sha256 hex
		}
	});

	/**
	 * Address analysis
	 */

	it("GET /v1/public/address/:address returns analysis across networks", async () => {
		const { status, json } = await get<{
			address: string;
			networks: unknown[];
		}>("/v1/public/address/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA");

		expect(status).toBe(200);
		expect(json).not.toBeNull();

		if (json) {
			expect(typeof json.address).toBe("string");
			expect(Array.isArray(json.networks)).toBe(true);
		}
	});

	it("GET /v1/public/address/:address/:network returns analysis or empty", async () => {
		const { status } = await get(
			"/v1/public/address/14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA/urn:ocn:net:1",
		);

		expect([200, 400]).toContain(status);
	});

	/**
	 * Categories
	 */

	it("GET /v1/public/category returns 404 when no categories", async () => {
		const { status } = await get("/v1/public/category/abcd/0/0/0");

		expect(status).toBe(404);
	});

	it("GET /v1/public/category with exists=true returns 204 or 404", async () => {
		const { status } = await get("/v1/public/category/abcd/0/0/0?exists=true");

		expect([204, 404]).toContain(status);
	});

	/**
	 * Tags
	 */

	it("GET /v1/public/tags returns 404 or array", async () => {
		const { status, json } = await get("/v1/public/tags/abcd/1");

		expect([200, 404]).toContain(status);

		if (status === 200 && json !== null) {
			expect(Array.isArray(json)).toBe(true);
		}
	});

	it("GET /v1/public/tag/:address/:tag/:network returns 404 or 204 when exists=true", async () => {
		const { status } = await get(
			"/v1/public/tag/abcd/phishing:ee/0x0101?exists=true",
		);

		expect([204, 404]).toContain(status);
	});
});
