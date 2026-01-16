import * as jose from "jose";

const AUTH_JWKS_URL = "https://dev-api.ocelloids.net/.well-known/jwks.json";

const jwksCache = new Map<string, jose.JWK>();

export async function loadJWKS(): Promise<void> {
	console.log("Loading JWKS", AUTH_JWKS_URL);
	const response = await fetch(AUTH_JWKS_URL);
	const jwks = await response.json();

	for (const key of jwks.keys) {
		console.log(`Loaded key ${key.kid}`);
		jwksCache.set(key.kid, key);
	}
}

export async function getOwnerHashFromRequest(
	req: Bun.BunRequest,
): Promise<Uint8Array | null> {
	const authHeader = req.headers.get("Authorization");
	if (!authHeader?.startsWith("Bearer ")) return null;

	const token = authHeader.slice("Bearer ".length);

	try {
		const header = jose.decodeProtectedHeader(token);

		if (!header?.kid || !jwksCache.has(header.kid)) {
			console.error("JWT kid not found in JWKS", header);
			return null;
		}

		const jwk = jwksCache.get(header.kid);
		if (!jwk) throw new Error("JWK not found");

		const { payload } = await jose.jwtVerify(token, await jose.importJWK(jwk), {
			issuer: "dev-api.ocelloids.net",
			// audience: "hyperion",
			algorithms: ["EdDSA"],
		});

		const sub = payload?.sub;
		if (!sub) return null;

		const padded = `OC.HYPERION_OWNER.${sub}`;

		return Bun.CryptoHasher.hash("sha256", padded);
	} catch (err) {
		console.error("JWT verification failed:", err);
		return null;
	}
}
