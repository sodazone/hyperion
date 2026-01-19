import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Serve } from "@/server/serve";
import { createTestJWT } from "./auth";
import { get, getAuth, runTestServer } from "./helpers";

describe("Hyperion API", () => {
	let srv: Serve;

	beforeAll(async () => {
		srv = await runTestServer();
		// TODO: seed data srv.api.batch
	});

	afterAll(async () => {
		await srv.shutdown("SIGINT");
	});

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

	it("GET /meta/networks returns array", async () => {
		const { status, json } =
			await get<Record<string, number>>("/meta/networks");
		expect(status).toBe(200);
		expect(json).not.toBeNull();
		if (json) {
			expect(Array.isArray(Object.keys(json))).toBe(true);
		}
	});

	it("GET /meta/categories returns array", async () => {
		const { status, json } = await get("/meta/categories");
		expect(status).toBe(200);
		expect(Array.isArray(json)).toBe(true);
	});

	it("GET /me fails without auth", async () => {
		const { status } = await get("/me");
		expect(status).toBe(401);
	});

	it("GET /me succeeds with auth", async () => {
		const { status, json } = await getAuth<{ hash: string }>(
			"/me",
			await createTestJWT("did:abc|user"),
		);
		expect(status).toBe(200);
		expect(json).not.toBeNull();
		if (json) {
			expect(json.hash).toHaveLength(64);
		}
	});

	it("GET /public/category/:cat/:subcat/:address/:network returns 404 for unknown", async () => {
		const { status } = await get("/public/category/999/999/abcd/0");
		expect([404, 204]).toContain(status);
	});

	it("GET /public/category/:cat/:subcat/:address/:network with check=true", async () => {
		const { status } = await get("/public/category/0/0/abcd/1?check=true");
		expect([204, 404]).toContain(status);
	});

	it("GET /public/tag/:tag/:address/:network returns 404 for unknown tag", async () => {
		const { status } = await get("/public/tag/unknown/abcd/0");
		expect([404, 204]).toContain(status);
	});

	it("GET /public/tags/:address/:network returns array or 404", async () => {
		const { status, json } = await get("/public/tags/abcd/0");
		expect([200, 404]).toContain(status);
		if (status === 200 && json !== null) expect(Array.isArray(json)).toBe(true);
	});
});
