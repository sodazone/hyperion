import { expect, it } from "bun:test";
import { CrosschainInvariantRule } from "../rule";
import { mockEvent } from "./_mock";

function makeCtx(configOverrides = {}) {
	const fakeState = new Map();

	const stateApi = {
		get: (ns: string, key: string) => fakeState.get(`${ns}:${key}`),
		set: (ns: string, key: string, value: any) =>
			fakeState.set(`${ns}:${key}`, value),
	};

	return {
		config: {
			subscriptionId: "sub-1",
			kSlack: 0.002,
			hThreshold: 0.01,
			level: 1,
			minConsecutive: 2,
			...configOverrides,
		},
		global: { state: stateApi },
		id: 1,
	};
}

it("fires after sustained deficit", async () => {
	const ctx = makeCtx();

	// rawDiff = -100
	// accumulation per tick = -100 + 10 = -90
	// threshold = 100
	// fires on 2nd tick (-180 < -100)

	for (let i = 0; i < 5; i++) {
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({ reserve: 1000, remote: 1100 }),
			ctx as any,
		);

		if (result.matched) {
			expect(result.data?.difference).toBe(100);
			return;
		}
	}

	throw new Error("CUSUM never fired");
});

it("does NOT fire if slack cancels deficit", async () => {
	const ctx = makeCtx({
		kSlack: 100, // exactly cancels rawDiff
		hThreshold: 50,
	});

	// rawDiff = -100
	// accumulation per tick = -100 + 100 = 0
	// never accumulates

	for (let i = 0; i < 50; i++) {
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({ reserve: 1000, remote: 1100 }),
			ctx as any,
		);

		expect(result.matched).toBe(false);
	}
});

it("does NOT fire if threshold too high", async () => {
	const ctx = makeCtx({
		kSlack: 10,
		hThreshold: 10_000,
	});

	for (let i = 0; i < 50; i++) {
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({ reserve: 1000, remote: 1100 }),
			ctx as any,
		);

		expect(result.matched).toBe(false);
	}
});

it("does NOT fire on single large spike", async () => {
	const ctx = makeCtx({
		kSlack: 10,
		hThreshold: 200,
	});

	// One large spike
	let result = await CrosschainInvariantRule.matcher(
		mockEvent({ reserve: 1000, remote: 1300 }),
		ctx as any,
	);

	expect(result.matched).toBe(false);

	// Then recovery
	result = await CrosschainInvariantRule.matcher(
		mockEvent({ reserve: 1000, remote: 1000 }),
		ctx as any,
	);

	expect(result.matched).toBe(false);
});

it("does NOT fire under small noise", async () => {
	const ctx = makeCtx({
		kSlack: 10,
		hThreshold: 100,
	});

	const noise = [5, -3, 7, -2, 4, -6, 3, -4];

	for (const n of noise) {
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({
				reserve: 1000,
				remote: 1000 + n,
			}),
			ctx as any,
		);

		expect(result.matched).toBe(false);
	}
});
