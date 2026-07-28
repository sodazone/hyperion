import { LabeledBimap } from "./bimap";

export const CAT = {
	EXCHANGE: 0x0001,
	DEFI: 0x0002,
	INFRASTRUCTURE: 0x0003,
	SANCTIONS: 0x0004,
	REGULATORY: 0x0005,
	SERVICES: 0x0006,
	HIGH_RISK: 0x0007,
	ANONYMIZING: 0x0008,
	CYBERCRIME: 0x0009,
	AUTOMATED: 0x000a,
	COMPROMISED: 0x000b,
	IDENTIFIED: 0x000c,
	RWA_TREASURY: 0x000d,
	OTC: 0x000e,
	VAULT_MPC: 0x000f,
	FIAT_GATEWAY: 0x0010,
	YIELD_REWARDS: 0x0011,
	PRIME_BROKERAGE: 0x0012,
	GAMBLING: 0x0013,
	NFT_GAMING: 0x0014,
} as const;

export const SUBCAT = {
	EXCHANGE: {
		ROOT: 0x0000,
		MANDATORY_KYC: 0x0001,
		OPTIONAL_KYC: 0x0002,
		INACTIVE: 0x0003,
	},
	DEFI: {
		ROOT: 0x0000,
		DEX_AMM: 0x0001,
		LENDING: 0x0002,
		PERPETUALS: 0x0003,
		DERIVATIVES: 0x0004,
		INSURANCE: 0x0005,
		PERIPHERY: 0x0006,
		LIQUIDITY_POOL: 0x0007,
		STABLECOIN_CDP: 0x0008,
		LIQUID_STAKING: 0x0009,
	},
	INFRASTRUCTURE: {
		ROOT: 0x0000,
		BRIDGE: 0x0001,
		ORACLE: 0x0002,
		SEQUENCER: 0x0003,
		CROSS_CHAIN_MESSAGING: 0x0004,
		ACCOUNT_ABSTRACTION: 0x0005,
		RPC_PROVIDER: 0x0006,
	},
	SANCTIONS: {
		ROOT: 0x0000,
		OFAC: 0x0001,
		EU: 0x0002,
		UK_OFSI: 0x0003,
		UN: 0x0004,
	},
	REGULATORY: {
		ROOT: 0x0000,
		AML_CFT_OBLIGATIONS: 0x0001,
		KYC_PROVIDER: 0x0002,
		REGULATED_ENTITY: 0x0003,
	},
	SERVICES: {
		ROOT: 0x0000,
		FINANCIAL_SERVICE: 0x0001,
		CUSTODY: 0x0002,
		MARKET_MAKING: 0x0003,
	},
	HIGH_RISK: {
		ROOT: 0x0000,
		HIGH_RISK_EXCHANGE: 0x0001,
		HIGH_RISK_JURISDICTION: 0x0002,
	},
	ANONYMIZING: {
		ROOT: 0x0000,
		DECENTRALIZED_MIXER: 0x0001,
		CENTRALIZED_MIXER: 0x0002,
		PRIVACY_PROTOCOL: 0x0003,
		STEALTH_ADDRESS: 0x0004,
	},
	CYBERCRIME: {
		ROOT: 0x0000,
		PONZI_SCHEME: 0x0001,
		SCAM: 0x0002,
		RANSOMWARE: 0x0003,
		MALWARE: 0x0004,
		PHISHING: 0x0005,
		DARKNET_MARKET: 0x0006,
		EXPLOIT_ATTACKER: 0x0007,
		DRAINER_WALLET: 0x0008,
		RUG_PULL_OPERATOR: 0x0009,
		KEY_THEFT_ATTACKER: 0x000a,
		TERRORIST_FINANCING: 0x000b,
	},
	AUTOMATED: {
		ROOT: 0x0000,
		ARBITRAGE_BOT: 0x0001,
		MEV_BOT: 0x0002,
		MARKET_MAKING_BOT: 0x0003,
		LIQUIDATION_BOT: 0x0004,
		TRADING_BOT: 0x0005,
	},
	COMPROMISED: {
		ROOT: 0x0000,
		COMPROMISED_WALLET: 0x0001,
		SUSPECTED_COMPROMISE: 0x0002,
		PHISHED_VICTIM: 0x0003,
		DRAINED_VICTIM: 0x0004,
		LEAKED_PRIVATE_KEY: 0x0005,
		DUSTING_VICTIM: 0x0006,
	},
	IDENTIFIED: {
		ROOT: 0x0000,
		ONCHAIN_ATTESTATION: 0x0001,
		NATIONAL_IDENTITY: 0x0002,
	},
	RWA_TREASURY: {
		ROOT: 0x0000,
		TOKENIZED_DEBT: 0x0001,
		DAO_TREASURY: 0x0002,
		CORPORATE_TREASURY: 0x0003,
	},
	OTC: {
		ROOT: 0x0000,
		INSTITUTIONAL_DESK: 0x0001,
		P2P_PLATFORM: 0x0002,
	},
	VAULT_MPC: {
		ROOT: 0x0000,
		COLD_STORAGE: 0x0001,
		MPC_MULTISIG: 0x0002,
	},
	FIAT_GATEWAY: {
		ROOT: 0x0000,
		ON_RAMP: 0x0001,
		OFF_RAMP: 0x0002,
		CRYPTO_ATM: 0x0003,
	},
	YIELD_REWARDS: {
		ROOT: 0x0000,
		REWARD_DISTRIBUTOR: 0x0001,
		YIELD_AGGREGATOR: 0x0002,
		MINING_POOL: 0x0003,
		STAKING_VALIDATOR: 0x0004,
	},
	PRIME_BROKERAGE: {
		ROOT: 0x0000,
		CLEARING_SETTLEMENT: 0x0001,
		EXECUTION_SERVICES: 0x0002,
	},
	GAMBLING: {
		ROOT: 0x0000,
		CASINO: 0x0001,
		PREDICTION_MARKET: 0x0002,
		LOTTERY: 0x0003,
	},
	NFT_GAMING: {
		ROOT: 0x0000,
		NFT_MARKETPLACE: 0x0001,
		WEB3_GAME: 0x0002,
		GUILD_TREASURY: 0x0003,
	},
} as const;

function createCategoriesMap() {
	const categories = new LabeledBimap();

	// Category 0x0001 - Centralized Exchange
	categories.add(CAT.EXCHANGE, SUBCAT.EXCHANGE.ROOT, "Centralized Exchange");
	categories.add(
		CAT.EXCHANGE,
		SUBCAT.EXCHANGE.MANDATORY_KYC,
		"Mandatory KYC and AML",
	);
	categories.add(
		CAT.EXCHANGE,
		SUBCAT.EXCHANGE.OPTIONAL_KYC,
		"Optional KYC and AML",
	);
	categories.add(CAT.EXCHANGE, SUBCAT.EXCHANGE.INACTIVE, "Inactive Exchange");

	// Category 0x0002 - DeFi Protocol
	categories.add(CAT.DEFI, SUBCAT.DEFI.ROOT, "DeFi Protocol");
	categories.add(CAT.DEFI, SUBCAT.DEFI.LENDING, "Lending");
	categories.add(CAT.DEFI, SUBCAT.DEFI.PERPETUALS, "Perpetuals");
	categories.add(CAT.DEFI, SUBCAT.DEFI.DERIVATIVES, "Derivatives");
	categories.add(CAT.DEFI, SUBCAT.DEFI.INSURANCE, "Insurance");
	categories.add(CAT.DEFI, SUBCAT.DEFI.LIQUIDITY_POOL, "Liquidity Pool");
	categories.add(CAT.DEFI, SUBCAT.DEFI.PERIPHERY, "Periphery");
	categories.add(CAT.DEFI, SUBCAT.DEFI.DEX_AMM, "DEX / AMM");
	categories.add(CAT.DEFI, SUBCAT.DEFI.STABLECOIN_CDP, "Stablecoin / CDP");
	categories.add(
		CAT.DEFI,
		SUBCAT.DEFI.LIQUID_STAKING,
		"Liquid Staking & Restaking",
	);

	// Category 0x0003 - Infrastructure
	categories.add(
		CAT.INFRASTRUCTURE,
		SUBCAT.INFRASTRUCTURE.ROOT,
		"Infrastructure",
	);
	categories.add(CAT.INFRASTRUCTURE, SUBCAT.INFRASTRUCTURE.BRIDGE, "Bridge");
	categories.add(CAT.INFRASTRUCTURE, SUBCAT.INFRASTRUCTURE.ORACLE, "Oracle");
	categories.add(
		CAT.INFRASTRUCTURE,
		SUBCAT.INFRASTRUCTURE.SEQUENCER,
		"L2 Sequencer",
	);
	categories.add(
		CAT.INFRASTRUCTURE,
		SUBCAT.INFRASTRUCTURE.CROSS_CHAIN_MESSAGING,
		"Cross-Chain Messaging",
	);
	categories.add(
		CAT.INFRASTRUCTURE,
		SUBCAT.INFRASTRUCTURE.ACCOUNT_ABSTRACTION,
		"Account Abstraction Infra",
	);
	categories.add(
		CAT.INFRASTRUCTURE,
		SUBCAT.INFRASTRUCTURE.RPC_PROVIDER,
		"RPC Provider",
	);

	// Category 0x0004 - Sanctions
	categories.add(CAT.SANCTIONS, SUBCAT.SANCTIONS.ROOT, "Sanctions");
	categories.add(
		CAT.SANCTIONS,
		SUBCAT.SANCTIONS.OFAC,
		"OFAC Sanctioned Entity",
	);
	categories.add(CAT.SANCTIONS, SUBCAT.SANCTIONS.EU, "EU Sanctioned Entity");
	categories.add(
		CAT.SANCTIONS,
		SUBCAT.SANCTIONS.UK_OFSI,
		"UK OFSI Sanctioned Entity",
	);
	categories.add(CAT.SANCTIONS, SUBCAT.SANCTIONS.UN, "UN Sanctioned Entity");

	// Category 0x0005 - Regulatory Oversight
	categories.add(
		CAT.REGULATORY,
		SUBCAT.REGULATORY.ROOT,
		"Regulatory Oversight",
	);
	categories.add(
		CAT.REGULATORY,
		SUBCAT.REGULATORY.AML_CFT_OBLIGATIONS,
		"AML/CFT Obligations",
	);
	categories.add(
		CAT.REGULATORY,
		SUBCAT.REGULATORY.KYC_PROVIDER,
		"KYC Provider",
	);
	categories.add(
		CAT.REGULATORY,
		SUBCAT.REGULATORY.REGULATED_ENTITY,
		"Regulated Entity",
	);

	// Category 0x0006 - Services
	categories.add(CAT.SERVICES, SUBCAT.SERVICES.ROOT, "Services");
	categories.add(
		CAT.SERVICES,
		SUBCAT.SERVICES.FINANCIAL_SERVICE,
		"Financial Service",
	);
	categories.add(CAT.SERVICES, SUBCAT.SERVICES.CUSTODY, "Custody Provider");
	categories.add(CAT.SERVICES, SUBCAT.SERVICES.MARKET_MAKING, "Market Making");

	// Category 0x0007 - High Risk Organization
	categories.add(
		CAT.HIGH_RISK,
		SUBCAT.HIGH_RISK.ROOT,
		"High Risk Organization",
	);
	categories.add(
		CAT.HIGH_RISK,
		SUBCAT.HIGH_RISK.HIGH_RISK_EXCHANGE,
		"High Risk Exchange",
	);
	categories.add(
		CAT.HIGH_RISK,
		SUBCAT.HIGH_RISK.HIGH_RISK_JURISDICTION,
		"High Risk Jurisdiction Entity",
	);

	// Category 0x0008 - Anonymizing Services
	categories.add(
		CAT.ANONYMIZING,
		SUBCAT.ANONYMIZING.ROOT,
		"Anonymizing Services",
	);
	categories.add(
		CAT.ANONYMIZING,
		SUBCAT.ANONYMIZING.DECENTRALIZED_MIXER,
		"Decentralized Mixer",
	);
	categories.add(
		CAT.ANONYMIZING,
		SUBCAT.ANONYMIZING.CENTRALIZED_MIXER,
		"Centralized Mixer",
	);
	categories.add(
		CAT.ANONYMIZING,
		SUBCAT.ANONYMIZING.PRIVACY_PROTOCOL,
		"Privacy Protocol",
	);
	categories.add(
		CAT.ANONYMIZING,
		SUBCAT.ANONYMIZING.STEALTH_ADDRESS,
		"Stealth Address Contract",
	);

	// Category 0x0009 - Cybercrime
	categories.add(CAT.CYBERCRIME, SUBCAT.CYBERCRIME.ROOT, "Cybercrime");
	categories.add(
		CAT.CYBERCRIME,
		SUBCAT.CYBERCRIME.PONZI_SCHEME,
		"Ponzi Scheme",
	);
	categories.add(CAT.CYBERCRIME, SUBCAT.CYBERCRIME.SCAM, "Scam");
	categories.add(CAT.CYBERCRIME, SUBCAT.CYBERCRIME.RANSOMWARE, "Ransomware");
	categories.add(CAT.CYBERCRIME, SUBCAT.CYBERCRIME.MALWARE, "Malware");
	categories.add(CAT.CYBERCRIME, SUBCAT.CYBERCRIME.PHISHING, "Phishing");
	categories.add(
		CAT.CYBERCRIME,
		SUBCAT.CYBERCRIME.DARKNET_MARKET,
		"Darknet Market",
	);
	categories.add(
		CAT.CYBERCRIME,
		SUBCAT.CYBERCRIME.EXPLOIT_ATTACKER,
		"Exploit Attacker",
	);
	categories.add(
		CAT.CYBERCRIME,
		SUBCAT.CYBERCRIME.DRAINER_WALLET,
		"Drainer Wallet",
	);
	categories.add(
		CAT.CYBERCRIME,
		SUBCAT.CYBERCRIME.RUG_PULL_OPERATOR,
		"Rug Pull Operator",
	);
	categories.add(
		CAT.CYBERCRIME,
		SUBCAT.CYBERCRIME.KEY_THEFT_ATTACKER,
		"Key Theft Attacker",
	);
	categories.add(
		CAT.CYBERCRIME,
		SUBCAT.CYBERCRIME.TERRORIST_FINANCING,
		"Terrorist Financing",
	);

	// Category 0x000a - Automated Actors
	categories.add(CAT.AUTOMATED, SUBCAT.AUTOMATED.ROOT, "Automated Actors");
	categories.add(
		CAT.AUTOMATED,
		SUBCAT.AUTOMATED.ARBITRAGE_BOT,
		"Arbitrage Bot",
	);
	categories.add(CAT.AUTOMATED, SUBCAT.AUTOMATED.MEV_BOT, "MEV Bot");
	categories.add(
		CAT.AUTOMATED,
		SUBCAT.AUTOMATED.MARKET_MAKING_BOT,
		"Market Making Bot",
	);
	categories.add(
		CAT.AUTOMATED,
		SUBCAT.AUTOMATED.LIQUIDATION_BOT,
		"Liquidation Bot",
	);
	categories.add(CAT.AUTOMATED, SUBCAT.AUTOMATED.TRADING_BOT, "Trading Bot");

	// Category 0x000b - Compromised & Exposed
	categories.add(
		CAT.COMPROMISED,
		SUBCAT.COMPROMISED.ROOT,
		"Compromised & Exposed",
	);
	categories.add(
		CAT.COMPROMISED,
		SUBCAT.COMPROMISED.COMPROMISED_WALLET,
		"Compromised Wallet",
	);
	categories.add(
		CAT.COMPROMISED,
		SUBCAT.COMPROMISED.SUSPECTED_COMPROMISE,
		"Suspected Compromise",
	);
	categories.add(
		CAT.COMPROMISED,
		SUBCAT.COMPROMISED.PHISHED_VICTIM,
		"Phished Victim",
	);
	categories.add(
		CAT.COMPROMISED,
		SUBCAT.COMPROMISED.DRAINED_VICTIM,
		"Drained Wallet (Victim)",
	);
	categories.add(
		CAT.COMPROMISED,
		SUBCAT.COMPROMISED.LEAKED_PRIVATE_KEY,
		"Leaked Private Key",
	);
	categories.add(
		CAT.COMPROMISED,
		SUBCAT.COMPROMISED.DUSTING_VICTIM,
		"Dusting Victim",
	);

	// Category 0x000c - Identified
	categories.add(CAT.IDENTIFIED, SUBCAT.IDENTIFIED.ROOT, "Identified");
	categories.add(
		CAT.IDENTIFIED,
		SUBCAT.IDENTIFIED.ONCHAIN_ATTESTATION,
		"Onchain Attestation",
	);
	categories.add(
		CAT.IDENTIFIED,
		SUBCAT.IDENTIFIED.NATIONAL_IDENTITY,
		"National Identity",
	);

	// Category 0x000d - Real World Assets & Treasury
	categories.add(CAT.RWA_TREASURY, SUBCAT.RWA_TREASURY.ROOT, "RWA & Treasury");
	categories.add(
		CAT.RWA_TREASURY,
		SUBCAT.RWA_TREASURY.TOKENIZED_DEBT,
		"Tokenized Government Debt",
	);
	categories.add(
		CAT.RWA_TREASURY,
		SUBCAT.RWA_TREASURY.DAO_TREASURY,
		"DAO Treasury",
	);
	categories.add(
		CAT.RWA_TREASURY,
		SUBCAT.RWA_TREASURY.CORPORATE_TREASURY,
		"Corporate Treasury",
	);

	// Category 0x000e - OTC
	categories.add(CAT.OTC, SUBCAT.OTC.ROOT, "OTC");
	categories.add(CAT.OTC, SUBCAT.OTC.INSTITUTIONAL_DESK, "Institutional Desk");
	categories.add(CAT.OTC, SUBCAT.OTC.P2P_PLATFORM, "P2P Platform");

	// Category 0x000f - Vault & MPC
	categories.add(CAT.VAULT_MPC, SUBCAT.VAULT_MPC.ROOT, "Vault & MPC");
	categories.add(
		CAT.VAULT_MPC,
		SUBCAT.VAULT_MPC.COLD_STORAGE,
		"Cold Storage Vault",
	);
	categories.add(
		CAT.VAULT_MPC,
		SUBCAT.VAULT_MPC.MPC_MULTISIG,
		"MPC Multi-Sig Infrastructure",
	);

	// Category 0x0010 - Fiat Gateway
	categories.add(CAT.FIAT_GATEWAY, SUBCAT.FIAT_GATEWAY.ROOT, "Fiat Gateway");
	categories.add(
		CAT.FIAT_GATEWAY,
		SUBCAT.FIAT_GATEWAY.ON_RAMP,
		"On-Ramp (Inbound Rail)",
	);
	categories.add(
		CAT.FIAT_GATEWAY,
		SUBCAT.FIAT_GATEWAY.OFF_RAMP,
		"Off-Ramp (Outbound Rail)",
	);
	categories.add(
		CAT.FIAT_GATEWAY,
		SUBCAT.FIAT_GATEWAY.CRYPTO_ATM,
		"Crypto ATM Operator",
	);

	// Category 0x0011 - Yield & Rewards
	categories.add(
		CAT.YIELD_REWARDS,
		SUBCAT.YIELD_REWARDS.ROOT,
		"Yield & Rewards",
	);
	categories.add(
		CAT.YIELD_REWARDS,
		SUBCAT.YIELD_REWARDS.REWARD_DISTRIBUTOR,
		"Reward Distributor (Payouts)",
	);
	categories.add(
		CAT.YIELD_REWARDS,
		SUBCAT.YIELD_REWARDS.YIELD_AGGREGATOR,
		"Yield Aggregator",
	);
	categories.add(
		CAT.YIELD_REWARDS,
		SUBCAT.YIELD_REWARDS.MINING_POOL,
		"Mining Pool",
	);
	categories.add(
		CAT.YIELD_REWARDS,
		SUBCAT.YIELD_REWARDS.STAKING_VALIDATOR,
		"Staking Pool / Validator Node",
	);

	// Category 0x0012 - Prime Brokerage
	categories.add(
		CAT.PRIME_BROKERAGE,
		SUBCAT.PRIME_BROKERAGE.ROOT,
		"Prime Brokerage",
	);
	categories.add(
		CAT.PRIME_BROKERAGE,
		SUBCAT.PRIME_BROKERAGE.CLEARING_SETTLEMENT,
		"Clearing & Settlement",
	);
	categories.add(
		CAT.PRIME_BROKERAGE,
		SUBCAT.PRIME_BROKERAGE.EXECUTION_SERVICES,
		"Execution Services",
	);

	// Category 0x0013 - Gambling
	categories.add(CAT.GAMBLING, SUBCAT.GAMBLING.ROOT, "Gambling");
	categories.add(CAT.GAMBLING, SUBCAT.GAMBLING.CASINO, "Crypto Casino");
	categories.add(
		CAT.GAMBLING,
		SUBCAT.GAMBLING.PREDICTION_MARKET,
		"Prediction Market",
	);
	categories.add(CAT.GAMBLING, SUBCAT.GAMBLING.LOTTERY, "Onchain Lottery");

	// Category 0x0014 - NFT & Gaming
	categories.add(CAT.NFT_GAMING, SUBCAT.NFT_GAMING.ROOT, "NFT & Gaming");
	categories.add(
		CAT.NFT_GAMING,
		SUBCAT.NFT_GAMING.NFT_MARKETPLACE,
		"NFT Marketplace",
	);
	categories.add(CAT.NFT_GAMING, SUBCAT.NFT_GAMING.WEB3_GAME, "Web3 Game");
	categories.add(
		CAT.NFT_GAMING,
		SUBCAT.NFT_GAMING.GUILD_TREASURY,
		"Gaming Guild Treasury",
	);

	return categories;
}

const categories = createCategoriesMap();

export const CategoriesMap = {
	getLabel: (cat: number, sub: number = 0x0) => categories.getLabel(cat, sub),
	entries: () => categories.entries(),
};

export const topLevelCategories = CategoriesMap.entries()
	.filter((e) => e.subcategory === 0x0000)
	.sort((a, b) =>
		a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
	);
