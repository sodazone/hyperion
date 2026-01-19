import { serve } from "@/server/serve";
import { TEST_JWKS } from "./auth";

const BASE = "http://localhost:8800";

export async function get<T>(
	path: string,
): Promise<{ status: number; json: T | null }> {
	const res = await fetch(`${BASE}${path}`);
	let json: T | null = null;
	try {
		json = (await res.json()) as T;
	} catch {}
	return { status: res.status, json };
}

export async function getAuth<T>(
	path: string,
	token: string,
): Promise<{ status: number; json: T | null }> {
	const res = await fetch(`${BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	let json: T | null = null;
	try {
		json = (await res.json()) as T;
	} catch {}
	return { status: res.status, json };
}

export async function runTestServer() {
	return serve({
		port: 8800,
		hostname: "localhost",
		jwks: TEST_JWKS,
	});
}
