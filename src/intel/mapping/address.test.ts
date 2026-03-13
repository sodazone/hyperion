import { describe, expect, it } from "bun:test";
import { normalizeAddress } from "./address";

function hex(u8: Uint8Array): string {
	return Buffer.from(u8).toString("hex");
}

describe("normalizeAddress", () => {
	it("should normalize SS58 addresses", () => {
		const adddreses = [
			"7JsDb4rGhKdkJF2Bc9xmxdJkuaJPbmnqP3ckxHmJzViqZcg3",
			"0x382dda7599ea282e91b81f4a5faf82cc616f783817c2b7f85add1d0db101ea6a",
			"12GfJZjsUzXxTYXxYcYHArYzC1Hs9E83VniVCEFLpdG7pybW",
			"DqypYpgFaHQmfLtMgJKvf5qUyaTFbP5sfpkRbXwkLT6Pm47",
			"5DLNAEUodDGV21XSayVH2hiqLPJDSvZuRHz12wFzGYEberZ1",
			"DqypYpgFaHQmfLtMgJKvf5qUyaTFbP5sfpkRbXwkLT6Pm47",
			"XCxbXStQSubEqZH5GwQ4Mt7RS1LR9GeSVV9GeTr8uEZEeEa",
			"inH7WXhB2f3YxNCtLhSpAQxiQHvXWXgpNbQW1kT4cRXoWT1",
			"2DiaQUEi6V2gLFPXR16Zhfk5wq1PoRgHm5N4aRxxNtPyD6dB",
			"cnSkwn7ZyUaE36VAukiiKNWFfAfi6jF8K1yfU35BwcHERdYiq",
			"unfnidy6zAEn2pfk213s5dLsjAd8VCgisSjHCzoot5tPyJu2S",
		];
		for (const address of adddreses) {
			const normalized = normalizeAddress(address);

			expect(normalized.length).toBe(32);
			expect(hex(normalized)).toEqual(
				"382dda7599ea282e91b81f4a5faf82cc616f783817c2b7f85add1d0db101ea6a",
			);
		}

		expect(
			hex(normalizeAddress("111111111111111111111111111111111HC1")),
		).toEqual(
			"0000000000000000000000000000000000000000000000000000000000000000",
		);
	});

	it("should normalize Ethereum 20-byte hex with 0x prefix", () => {
		const addr = "0x0123456789abcdef0123456789abcdef01234567";
		const normalized = normalizeAddress(addr);

		expect(normalized.length).toBe(32);

		expect(hex(normalized)).toEqual(
			"0000000000000000000000000123456789abcdef0123456789abcdef01234567",
		);
	});

	it("should normalize Solana 32-byte base58 address", () => {
		const addr = "4uLkNz2JhP9K5TqzR2n5z7o9eGzxE3L3kR1RM9Zx6j2v";
		const normalized = normalizeAddress(addr);

		expect(normalized.length).toBe(32);

		const expected = Buffer.from(
			"39fb978603d729207d851997531b427560122190b23dcc7e20b475c96beca18f",
			"hex",
		);

		expect(hex(normalized)).toHaveLength(64);
		expect(normalized).toEqual(expected);
	});

	it("should normalize legacy and bech32 addresses to the same key", () => {
		const legacy = "1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH";
		const bech32 = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

		const n1 = normalizeAddress(legacy);
		const n2 = normalizeAddress(bech32);

		// pub key = 0x751e76e8199196d454941c45d1b3a323f1433bd6
		expect(n1.length).toBe(32);
		expect(n2.length).toBe(32);
		expect(hex(n1)).toEqual(hex(n2));
		expect(n1).toEqual(
			Buffer.from(
				"000000000000000000000000751e76e8199196d454941c45d1b3a323f1433bd6",
				"hex",
			),
		);
	});

	it("should not match P2SH with P2PKH", () => {
		const p2pkh = normalizeAddress("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
		const p2sh = normalizeAddress("3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr");

		expect(hex(p2pkh)).not.toEqual(hex(p2sh));
	});

	it("should normalize Taproot bc1p address as 32-byte program", () => {
		const addr =
			"bc1pmfr3p9j00pfxjh0zmgp99y8zftmd3s5pmedqhyptwy6lm87hf5sspknck9";

		const normalized = normalizeAddress(addr);

		expect(normalized.length).toBe(32);
		expect(hex(normalized)).toHaveLength(64);
	});

	it("should hash unknown formats deterministically", () => {
		const addr = "this-is-not-an-address";
		const n1 = normalizeAddress(addr);
		const n2 = normalizeAddress(addr);

		expect(n1.length).toBe(32);
		expect(hex(n1)).toEqual(hex(n2));
	});

	it("should always return exactly 32 bytes", () => {
		const samples = [
			"0x0123456789abcdef0123456789abcdef01234567",
			"1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
			"7JsDb4rGhKdkJF2Bc9xmxdJkuaJPbmnqP3ckxHmJzViqZcg3",
			"4uLkNz2JhP9K5TqzR2n5z7o9eGzxE3L3kR1RM9Zx6j2v",
			"random-garbage",
		];

		for (const addr of samples) {
			const normalized = normalizeAddress(addr);
			expect(normalized.length).toBe(32);
		}
	});
});
