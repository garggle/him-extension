type StrategyCard = {
	type: 'strategy';
	header: string;
	entry: string;
	tp_sl: string;
	timeframe: string;
	metrics: string[];
};

type LiquidityCard = {
	type: 'liquidity';
	header: string;
	liquidity: string;
	netVolume: string;
	buyerSellerRatio: string;
	interpretation: string;
	metrics: string[];
};

type HolderCard = {
	type: 'holders';
	header: string;
	holders: number;
	proTraders: number;
	top10Percentage: string;
	interpretation: string;
	metrics: string[];
};

type ManipulationCard = {
	type: 'manipulation';
	header: string;
	insiderHoldings: string;
	developerHolding: string;
	sniperHolding: string;
	lpBurned: string;
	bundlers: string;
	interpretation: string;
};

type FinalCallCard = {
	type: 'final_call';
	header: string;
	basedOn: string[];
	text: string;
	metrics: string[];
};

type TradingCard = StrategyCard | LiquidityCard | HolderCard | ManipulationCard | FinalCallCard;
