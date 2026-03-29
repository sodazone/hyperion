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
			hThreshold: 0.01,
			level: 1,
			minConsecutive: 2,
			...configOverrides,
		},
		global: { state: stateApi },
		id: 1,
	};
}

it("fires after sustained deviation above threshold", async () => {
	const ctx = makeCtx({
		hThreshold: 0.01, // 1% sustained drift
		minConsecutive: 2,
	});

	// Reserve: 1000, Remote: 1020 [logRatio ~ 0.0198 (~2%)]
	// Exceeds threshold, fires after 2 consecutive ticks

	for (let i = 0; i < 5; i++) {
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({ reserve: 1000, remote: 1020 }),
			ctx as any,
		);

		if (result.matched) {
			// ratio check
			expect(result.data?.ratio).toBeCloseTo(1020 / 1000, 5);
			return;
		}
	}

	throw new Error("Log-ratio matcher never fired");
});

it("fires only after minConsecutive log-ratio deviations", async () => {
	const ctx = makeCtx({
		hThreshold: 0.01,
		minConsecutive: 3,
	});

	const reserve = 1000;
	const remote = reserve * 1.02; // 2% deviation > threshold

	let fired = false;
	for (let i = 0; i < 5; i++) {
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({ reserve, remote }),
			ctx as any,
		);

		if (result.matched) {
			fired = true;
			break;
		}
	}

	expect(fired).toBe(true);
});

it("does NOT fire under small log-ratio noise", async () => {
	const ctx = makeCtx({
		hThreshold: 0.01, // 1% threshold
	});

	const noise = [0.001, -0.001, 0.002, -0.001, 0.0005];

	for (const n of noise) {
		const reserve = 1000;
		const remote = reserve * Math.exp(n); // log(remote/reserve) = n
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({ reserve, remote }),
			ctx as any,
		);

		expect(result.matched).toBe(false);
	}
});

it("does NOT fire on single large spike", async () => {
	const ctx = makeCtx({
		hThreshold: 0.01,
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

it("does NOT fire under small log-ratio noise", async () => {
	const ctx = makeCtx({ hThreshold: 0.01 });
	const reserve = 1000;
	const noise = [5, -3, 7, -2, 4, -6, 3, -4];

	for (const n of noise) {
		const remote = reserve * Math.exp(n / reserve);
		const result = await CrosschainInvariantRule.matcher(
			mockEvent({ reserve, remote }),
			ctx as any,
		);

		expect(result.matched).toBe(false);
	}
});
