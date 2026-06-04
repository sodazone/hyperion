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
		subscriptionId = "hyperion:polkadot-hydration_xcm",
		reserveDecimals = 0,
		remoteDecimals = 0,
	} = overrides;

	return {
		type: "issuance",
		origin: { chainURN: "urn:ocn:polkadot:2034", timestamp: Date.now() },

		payload: {
			subscriptionId,
			protocol: "hydration",
			reserve: String(reserve),
			remote: String(remote),

			inputs: {
				reserveChain: "urn:ocn:polkadot:2034",
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
