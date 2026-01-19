import * as jose from "jose";

export type JWKSSource = string | { keys: jose.JWK[] };

const AUTH_JWKS_URL = "https://dev-api.ocelloids.net/.well-known/jwks.json";

const jwksCache = new Map<string, jose.JWK>();

export async function loadJWKS(jwksSource?: JWKSSource): Promise<void> {
	let jwks: { keys: jose.JWK[] };

	if (typeof jwksSource === "string") {
		console.log("Loading JWKS from URL", jwksSource);
		const res = await fetch(jwksSource);
		jwks = await res.json();
	} else if (jwksSource) {
		jwks = jwksSource;
		console.log("Loading JWKS from provided object");
	} else {
		jwks = await fetch(AUTH_JWKS_URL).then((r) => r.json());
		console.log("Loading JWKS from default URL");
	}

	for (const key of jwks.keys) {
		console.log(`Loaded key ${key.kid}`);
		if (key.kid) jwksCache.set(key.kid, key);
		else console.error("Key without kid found", key);
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
