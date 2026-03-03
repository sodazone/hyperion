import type { IssuanceEvent } from "../../../types";

type MockOverrides = {
	reserve?: number | string;
	remote?: number | string;
	subscriptionId?: string;
	reserveDecimals?: number;
	remoteDecimals?: number;
};

export function mockEvent(overrides: MockOverrides = {}): IssuanceEvent {
	const {
		reserve = "1000",
		remote = "1000",
		subscriptionId = "sub-1",
		reserveDecimals = 0,
		remoteDecimals = 0,
	} = overrides;

	return {
		type: "issuance",
		origin: { chainURN: "test", timestamp: Date.now() },

		payload: {
			subscriptionId,
			reserve: String(reserve),
			remote: String(remote),

			inputs: {
				reserveChain: "urn:chain:1",
				remoteChain: "urn:chain:2",

				reserveAddress: "0xreserve",
				reserveAssetId: "asset-1",
				remoteAssetId: "asset-1",

				reserveDecimals,
				remoteDecimals,

				assetSymbol: "TEST",
			},
		},
	};
}
