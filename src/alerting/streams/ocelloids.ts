import type { AnyEvent } from "../rules";

// TODO: Real interface
export type OcelloidsClient = {
	subscribeStorage: (
		params: { chain: string; key: string },
		emit: (msg: AnyEvent) => void,
	) => () => void;
	subscribeTransfers: (emit: (msg: AnyEvent) => void) => () => void;
};

function randomUsd() {
	const base = Math.random() * 50_000;
	const spike = Math.random() < 0.1 ? Math.random() * 1_000_000 : 0;
	return Math.round(base + spike);
}

export function createDummyOcelloidsClient(): OcelloidsClient {
	return {
		subscribeStorage: (_params: { chain: string; key: string }, _emit) => {
			// Implement the subscription logic here
			return () => {
				// Implement the logic to unsubscribe
			};
		},
		subscribeTransfers: (emit) => {
			console.log("Subscribing to transfers...");
			const id = setInterval(() => {
				try {
					console.log("Transferring...");
					const amountUsd = randomUsd();

					const event: AnyEvent = {
						type: "transfer",
						chain: "urn:ocn:polkadot:1000",
						blockHeight: "10000",
						timestamp: Date.now(),
						payload: {
							from: "11Rq57qP9eN3eXULWvLmKBoHzGdRU9ubbuCExn4m27h94t7",
							to: "113EhPbHBC5EDaPGTFo5UJ6zkAGm6LuW6NyourkLfe63M54",
							amountUsd,
							amount: BigInt(Math.floor(amountUsd * 1e6)),
							asset: {
								id: "xxx",
								symbol: "XX",
								decimals: 18,
							},
						},
					};

					emit(event);
				} catch (e) {
					console.error("interval crash", e);
				}
			}, 1_000);

			return () => clearInterval(id);
		},
	};
}
