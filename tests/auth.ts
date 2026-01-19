import * as jose from "jose";

const privateJWK = {
	crv: "Ed25519",
	d: "u9eMiidKMo2kp_CO7vuAXoKjc4Lc3xOfd3vnZh8Z16g",
	kty: "OKP",
	x: "hWH8zK5w_Am4JMDjypRACgTvwUCNR3XppMLAwl4irB8",
	kid: "test-key-1",
	use: "sig",
	alg: "EdDSA",
};

export const TEST_JWKS: { keys: jose.JWK[] } = {
	keys: [
		{
			crv: "Ed25519",
			kty: "OKP",
			x: "hWH8zK5w_Am4JMDjypRACgTvwUCNR3XppMLAwl4irB8",
			kid: "test-key-1",
			use: "sig",
			alg: "EdDSA",
		},
	],
};

export async function createTestJWT(sub: string) {
	const key = await jose.importJWK(privateJWK, "EdDSA");

	return await new jose.SignJWT({ sub })
		.setProtectedHeader({ alg: "EdDSA", kid: privateJWK.kid })
		.setIssuer("dev-api.ocelloids.net")
		.setAudience("hyperion")
		.setExpirationTime("2h")
		.sign(key);
}
