import { exportJWK, generateKeyPair } from "jose";

const { publicKey, privateKey } = await generateKeyPair("EdDSA", {
	extractable: true,
});

const privateJWK = await exportJWK(privateKey);
const publicJWK = await exportJWK(publicKey);

privateJWK.kid = "test-key-1";
privateJWK.use = "sig";
privateJWK.alg = "EdDSA";

publicJWK.kid = "test-key-1";
publicJWK.use = "sig";
publicJWK.alg = "EdDSA";

console.log(JSON.stringify({ keys: [privateJWK] }, null, 2));
