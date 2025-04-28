/**
 * TradingModel - Memecoin trading decision engine
 * Analyzes technical and fundamental factors to recommend buy/sell actions
 */

import { parseMoneyString, parsePercentString } from '../utils/parse-metrics.js';

export type Snapshot = {
	userTrading: {
		bought: string;
		sold: string;
		holding: string;
		pnl: string;
		balance: string;
	};
	tokenInfo: {
		top10Holders: string;
		developerHolding: string;
		sniperHolding: string;
		insiderHoldings: string;
		bundlers: string;
		lpBurned: string;
		holders: string;
		proTraders: string;
		dexPaid: string;
	};
	overall: {
		mcap: string;
		price: string;
		liquidity: string;
		totalSupply: string;
	};
	timestamped: {
		volume: string;
		buyers: string;
		sellers: string;
	};
};

export type Candle = {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
};

export type Trade = {
	timestamp: string;
	type: 'buy' | 'sell';
	price: number;
	amount: number;
	txHash: string;
};

export type TradingFactors = {
	momentum: number; // price vs SMA
	volumeTrend: number; // recent volume change
	flowRatio: number; // buys ÷ sells
	liquidityScore: number; // liquidity ÷ mcap
	whaleRisk: number; // insider & top-holder %
};

export type Decision = 'BUY' | 'SELL' | 'HOLD';

export type ModelResult = {
	decision: Decision;
	score: number;
	factors: TradingFactors;
};

export type ModelWeights = {
	momentum: number;
	volumeTrend: number;
	flowRatio: number;
	liquidityScore: number;
	whaleRisk: number;
};

export type ModelThresholds = {
	buy: number;
	sell: number;
};

export const DEFAULT_WEIGHTS: ModelWeights = {
	momentum: 0.4,
	volumeTrend: 0.2,
	flowRatio: 0.2,
	liquidityScore: 0.1,
	whaleRisk: 0.1
};

export const DEFAULT_THRESHOLDS: ModelThresholds = {
	buy: 0.15,
	sell: -0.15
};

/**
 * Calculate Simple Moving Average for a given period
 */
export function calculateSMA(candles: Candle[], period: number): number {
	if (candles.length < period) return 0;

	const relevantCandles = candles.slice(-period);
	const sum = relevantCandles.reduce((acc, candle) => acc + candle.close, 0);
	return sum / period;
}

/**
 * Calculate momentum factor (current price vs longer SMA)
 */
export function calculateMomentum(candles: Candle[]): number {
	if (candles.length < 30) return 0;

	const currentPrice = candles[candles.length - 1].close;
	const sma30 = calculateSMA(candles, 30);

	return sma30 > 0 ? (currentPrice - sma30) / sma30 : 0;
}

/**
 * Calculate volume trend (recent volume change)
 */
export function calculateVolumeTrend(candles: Candle[]): number {
	if (candles.length < 10) return 0;

	const recentVolume = candles.slice(-5).reduce((sum, candle) => sum + candle.volume, 0);
	const previousVolume = candles.slice(-10, -5).reduce((sum, candle) => sum + candle.volume, 0);

	return previousVolume > 0 ? (recentVolume - previousVolume) / previousVolume : 0;
}

/**
 * Calculate buy/sell flow ratio from recent trades
 */
export function calculateFlowRatio(trades: Trade[]): number {
	// Filter to recent trades (last 5 minutes)
	const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
	const recentTrades = trades.filter((trade) => trade.timestamp >= fiveMinutesAgo);

	if (recentTrades.length === 0) return 1.0; // Neutral if no trades

	const buyAmount = recentTrades
		.filter((trade) => trade.type === 'buy')
		.reduce((sum, trade) => sum + trade.amount, 0);

	const sellAmount = recentTrades
		.filter((trade) => trade.type === 'sell')
		.reduce((sum, trade) => sum + trade.amount, 0);

	return sellAmount > 0 ? buyAmount / sellAmount : buyAmount > 0 ? 2.0 : 1.0;
}

/**
 * Core function to analyze market data and produce a trading decision
 */
export function analyzeTradingOpportunity(
	snapshot: Snapshot,
	candles: Candle[],
	trades: Trade[],
	weights: ModelWeights = DEFAULT_WEIGHTS,
	thresholds: ModelThresholds = DEFAULT_THRESHOLDS
): ModelResult {
	console.log('Trading Model - Starting analysis with snapshot:', snapshot);
	console.log('Trading Model - Candles count:', candles.length);
	console.log('Trading Model - Trades count:', trades.length);

	// Ensure data is sorted chronologically
	const sortedCandles = [...candles].sort((a, b) => a.timestamp - b.timestamp);
	const sortedTrades = [...trades].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);

	// Calculate individual factors
	const factors: TradingFactors = {
		momentum: calculateMomentum(sortedCandles),
		volumeTrend: calculateVolumeTrend(sortedCandles),
		flowRatio: calculateFlowRatio(sortedTrades) - 1.0, // Normalize to 0 being neutral
		liquidityScore: 0, // Will be calculated from snapshot
		whaleRisk: 0 // Will be calculated from snapshot
	};

	// Parse relevant metrics from snapshot
	const liquidity = parseMoneyString(snapshot.overall.liquidity);
	const mcap = parseMoneyString(snapshot.overall.mcap);

	console.log('Trading Model - Parsed metrics:', {
		liquidity,
		mcap,
		price: parseMoneyString(snapshot.overall.price)
	});

	// Calculate on-chain / fundamental factors
	if (mcap > 0) {
		factors.liquidityScore = liquidity / mcap;
	}

	factors.whaleRisk =
		parsePercentString(snapshot.tokenInfo.top10Holders) +
		parsePercentString(snapshot.tokenInfo.developerHolding) +
		parsePercentString(snapshot.tokenInfo.insiderHoldings);

	console.log('Trading Model - Calculated factors:', factors);

	// Calculate weighted composite score
	const score =
		weights.momentum * factors.momentum +
		weights.volumeTrend * factors.volumeTrend +
		weights.flowRatio * factors.flowRatio +
		weights.liquidityScore * factors.liquidityScore -
		weights.whaleRisk * factors.whaleRisk;

	console.log('Trading Model - Score calculation:', {
		weightedMomentum: weights.momentum * factors.momentum,
		weightedVolumeTrend: weights.volumeTrend * factors.volumeTrend,
		weightedFlowRatio: weights.flowRatio * factors.flowRatio,
		weightedLiquidityScore: weights.liquidityScore * factors.liquidityScore,
		weightedWhaleRisk: -weights.whaleRisk * factors.whaleRisk,
		totalScore: score
	});

	// Determine decision based on thresholds
	let decision: Decision = 'HOLD';
	if (score >= thresholds.buy) {
		decision = 'BUY';
	} else if (score <= thresholds.sell) {
		decision = 'SELL';
	}

	console.log('Trading Model - Final decision:', {
		decision,
		score,
		thresholds
	});

	return {
		decision,
		score,
		factors
	};
}
