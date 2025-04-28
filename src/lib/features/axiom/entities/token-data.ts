/**
 * Domain entities for Axiom token data
 */

/**
 * Represents user trading data for a token
 */
export class UserTradingData {
	constructor(
		public readonly bought: string | null,
		public readonly sold: string | null,
		public readonly holding: string | null,
		public readonly pnl: string | null,
		public readonly balance: string | null
	) {}

	/**
	 * Creates a new instance from raw data
	 */
	static create(data: {
		bought: string | null;
		sold: string | null;
		holding: string | null;
		pnl: string | null;
		balance: string | null;
	}): UserTradingData {
		return new UserTradingData(data.bought, data.sold, data.holding, data.pnl, data.balance);
	}
}

/**
 * Represents token information data
 */
export class TokenInfoData {
	constructor(
		public readonly top10Holders: string | null,
		public readonly developerHolding: string | null,
		public readonly sniperHolding: string | null,
		public readonly insiderHoldings: string | null,
		public readonly bundlers: string | null,
		public readonly lpBurned: string | null,
		public readonly holders: string | null,
		public readonly proTraders: string | null,
		public readonly dexPaid: string | null
	) {}

	/**
	 * Creates a new instance from raw data
	 */
	static create(data: {
		top10Holders: string | null;
		developerHolding: string | null;
		sniperHolding: string | null;
		insiderHoldings: string | null;
		bundlers: string | null;
		lpBurned: string | null;
		holders: string | null;
		proTraders: string | null;
		dexPaid: string | null;
	}): TokenInfoData {
		return new TokenInfoData(
			data.top10Holders,
			data.developerHolding,
			data.sniperHolding,
			data.insiderHoldings,
			data.bundlers,
			data.lpBurned,
			data.holders,
			data.proTraders,
			data.dexPaid
		);
	}
}

/**
 * Represents overall token data
 */
export class OverallData {
	constructor(
		public readonly mcap: string | null,
		public readonly price: string | null,
		public readonly liquidity: string | null,
		public readonly totalSupply: string | null
	) {}

	/**
	 * Creates a new instance from raw data
	 */
	static create(data: {
		mcap: string | null;
		price: string | null;
		liquidity: string | null;
		totalSupply: string | null;
	}): OverallData {
		return new OverallData(data.mcap, data.price, data.liquidity, data.totalSupply);
	}
}

/**
 * Represents timestamped token data
 */
export class TimestampedData {
	constructor(
		public readonly volume: string | null,
		public readonly buyers: string | null,
		public readonly sellers: string | null
	) {}

	/**
	 * Creates a new instance from raw data
	 */
	static create(data: {
		volume: string | null;
		buyers: string | null;
		sellers: string | null;
	}): TimestampedData {
		return new TimestampedData(data.volume, data.buyers, data.sellers);
	}
}

/**
 * Main entity representing all token data from Axiom
 */
export class AxiomTokenData {
	constructor(
		public readonly userTrading: UserTradingData,
		public readonly tokenInfo: TokenInfoData,
		public readonly overall: OverallData,
		public readonly timestamped: TimestampedData
	) {}

	/**
	 * Creates a new instance from raw data
	 */
	static create(data: {
		userTrading: {
			bought: string | null;
			sold: string | null;
			holding: string | null;
			pnl: string | null;
			balance: string | null;
		};
		tokenInfo: {
			top10Holders: string | null;
			developerHolding: string | null;
			sniperHolding: string | null;
			insiderHoldings: string | null;
			bundlers: string | null;
			lpBurned: string | null;
			holders: string | null;
			proTraders: string | null;
			dexPaid: string | null;
		};
		overall: {
			mcap: string | null;
			price: string | null;
			liquidity: string | null;
			totalSupply: string | null;
		};
		timestamped: {
			volume: string | null;
			buyers: string | null;
			sellers: string | null;
		};
	}): AxiomTokenData {
		return new AxiomTokenData(
			UserTradingData.create(data.userTrading),
			TokenInfoData.create(data.tokenInfo),
			OverallData.create(data.overall),
			TimestampedData.create(data.timestamped)
		);
	}
}
