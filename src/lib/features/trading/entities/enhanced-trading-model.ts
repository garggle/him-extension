/**
 * Enhanced Trading Model
 * Extends the core trading model with normalized factors and technical indicators
 */

import {
	type Candle,
	type Decision,
	type Snapshot,
	type Trade
} from '$lib/shared/entities/trading-model.js';
import { normalizeRSI, normalizeVolatility } from '$lib/shared/utils/normalization.js';
import { parseMoneyString, parsePercentString } from '$lib/shared/utils/parse-metrics.js';
import {
	calculateATR,
	calculateBollingerBands,
	calculateEMA,
	calculateRSI,
	calculateVWAP
} from '$lib/shared/utils/technical-indicators.js';
import { analyzeTradingFlow } from '../application/flow-analysis.js';
import {
	DEFAULT_PERIODS,
	DEFAULT_THRESHOLDS,
	DEFAULT_WEIGHTS,
	type ModelThresholds,
	type ModelWeights
} from '../config/model-config.js';
import {
	type EnhancedModelResult,
	type EnhancedTradingFactors,
	type NormalizedFactors
} from './trading-types.js';

/**
 * Analyzes trading data with enhanced model and normalized factors
 */
export function analyzeEnhancedTradingOpportunity(
	snapshot: Snapshot,
	candles: Candle[],
	trades: Trade[],
	weights: ModelWeights = DEFAULT_WEIGHTS,
	thresholds: ModelThresholds = DEFAULT_THRESHOLDS
): EnhancedModelResult {
	console.log('Enhanced Trading Model - Starting analysis');

	// Ensure data is sorted chronologically
	const sortedCandles = [...candles].sort((a, b) => a.timestamp - b.timestamp);
	const sortedTrades = [...trades].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);

	// Calculate technical indicators if we have sufficient candle data
	const indicators = calculateTechnicalIndicators(sortedCandles);

	// Analyze trade flow
	const flowAnalysis = analyzeTradingFlow(sortedTrades);

	// Calculate raw factors
	const rawFactors = calculateRawFactors(snapshot, sortedCandles, indicators, flowAnalysis);

	// Normalize all factors to [-1, 1] range
	const normalizedFactors = normalizeFactors(rawFactors);

	// Calculate weighted factors and overall score
	const factorContributions = calculateFactorContributions(normalizedFactors, weights);
	const factorSum = Object.values(factorContributions).reduce((sum, value) => sum + value, 0);

	// Apply tanh to keep score bounded in [-1, 1] and dampen extreme values
	const score = Math.tanh(factorSum);

	console.log('Enhanced Trading Model - Score calculation:', {
		rawFactors,
		normalizedFactors,
		factorContributions,
		factorSum,
		finalScore: score
	});

	// Determine decision based on thresholds
	let decision: Decision = 'HOLD';
	if (score >= thresholds.buy) {
		decision = 'BUY';
	} else if (score <= thresholds.sell) {
		decision = 'SELL';
	}

	console.log('Enhanced Trading Model - Final decision:', {
		decision,
		score,
		thresholds
	});

	return {
		decision,
		score,
		normalizedFactors,
		rawFactors,
		factorContributions
	};
}

/**
 * Calculate technical indicators for the candle data
 */
function calculateTechnicalIndicators(candles: Candle[]) {
	const periods = DEFAULT_PERIODS;
	const result = {
		ema: {
			short: [] as number[],
			long: [] as number[]
		},
		rsi: [] as number[],
		atr: [] as number[],
		vwap: [] as number[],
		bb: {
			middle: [] as number[],
			upper: [] as number[],
			lower: [] as number[],
			width: [] as number[]
		}
	};

	// Skip calculations if insufficient data
	if (candles.length < Math.max(periods.shortEMA, periods.longEMA, periods.rsi, periods.atr)) {
		return result;
	}

	// Calculate EMAs
	result.ema.short = calculateEMA(candles, periods.shortEMA);
	result.ema.long = calculateEMA(candles, periods.longEMA);

	// Calculate RSI
	result.rsi = calculateRSI(candles, periods.rsi);

	// Calculate ATR
	result.atr = calculateATR(candles, periods.atr);

	// Calculate VWAP
	result.vwap = calculateVWAP(candles, periods.vwap);

	// Calculate Bollinger Bands
	const bbResult = calculateBollingerBands(candles, periods.bollingerBands);
	result.bb.middle = bbResult.middle;
	result.bb.upper = bbResult.upper;
	result.bb.lower = bbResult.lower;
	result.bb.width = bbResult.width;

	return result;
}

/**
 * Calculate raw factor values
 */
function calculateRawFactors(
	snapshot: Snapshot,
	candles: Candle[],
	indicators: ReturnType<typeof calculateTechnicalIndicators>,
	flowAnalysis: ReturnType<typeof analyzeTradingFlow>
): EnhancedTradingFactors {
	// Parse relevant metrics from snapshot
	const liquidity = parseMoneyString(snapshot.overall.liquidity);
	const mcap = parseMoneyString(snapshot.overall.mcap);
	const price = parseMoneyString(snapshot.overall.price);

	console.log('Enhanced Trading Model - Parsed metrics:', {
		liquidity,
		mcap,
		price
	});

	// Initialize factors
	const factors: EnhancedTradingFactors = {
		momentum: 0,
		volumeTrend: 0,
		flowImbalance: 0,
		liquidityScore: 0,
		whaleRisk: 0,
		rsi: 0,
		volatility: 0,
		vwapDeviation: 0,
		volatilityAdjustedMomentum: 0
	};

	// Calculate momentum if we have sufficient candle data
	if (candles.length > 0 && indicators.ema.short.length > 0 && indicators.ema.long.length > 0) {
		const shortEma = indicators.ema.short[indicators.ema.short.length - 1];
		const longEma = indicators.ema.long[indicators.ema.long.length - 1];

		// Momentum as percent difference between short and long EMAs
		factors.momentum = longEma !== 0 ? (shortEma - longEma) / longEma : 0;
	} else if (candles.length >= 2) {
		// Fallback: simple price change if insufficient data for EMAs
		const currentPrice = candles[candles.length - 1].close;
		const previousPrice = candles[candles.length - 2].close;
		factors.momentum = previousPrice !== 0 ? (currentPrice - previousPrice) / previousPrice : 0;
	}

	// Calculate volume trend if we have sufficient candle data
	if (candles.length >= 10) {
		const recentVolume = candles.slice(-5).reduce((sum, candle) => sum + candle.volume, 0);
		const previousVolume = candles.slice(-10, -5).reduce((sum, candle) => sum + candle.volume, 0);

		factors.volumeTrend = previousVolume > 0 ? (recentVolume - previousVolume) / previousVolume : 0;
	}

	// Flow imbalance from flow analysis
	factors.flowImbalance = flowAnalysis.flowImbalance;

	// Liquidity score
	factors.liquidityScore = mcap > 0 ? liquidity / mcap : 0;

	// Whale risk from ownership percentages
	factors.whaleRisk =
		parsePercentString(snapshot.tokenInfo.top10Holders) +
		parsePercentString(snapshot.tokenInfo.developerHolding) +
		parsePercentString(snapshot.tokenInfo.insiderHoldings);

	// RSI if available
	if (indicators.rsi.length > 0) {
		factors.rsi = indicators.rsi[indicators.rsi.length - 1];
	}

	// Volatility from Bollinger Band width
	if (indicators.bb.width.length > 0) {
		factors.volatility = indicators.bb.width[indicators.bb.width.length - 1];
	}

	// VWAP deviation
	if (indicators.vwap.length > 0 && candles.length > 0) {
		const vwap = indicators.vwap[indicators.vwap.length - 1];
		const currentPrice = candles[candles.length - 1].close;

		factors.vwapDeviation = vwap !== 0 ? (currentPrice - vwap) / vwap : 0;
	}

	// Volatility-adjusted momentum
	factors.volatilityAdjustedMomentum = factors.momentum / (factors.volatility + 0.1);

	return factors;
}

/**
 * Normalize all factors to [-1, 1] range
 */
function normalizeFactors(factors: EnhancedTradingFactors): NormalizedFactors {
	return {
		// Price momentum: tanh(momentum * 5) bounds to [-1, 1]
		momentum: Math.tanh(factors.momentum * 5),

		// Volume trend: tanh(volumeTrend * 3) bounds to [-1, 1]
		volumeTrend: Math.tanh(factors.volumeTrend * 3),

		// Flow imbalance is already in [-1, 1]
		flowImbalance: factors.flowImbalance,

		// Liquidity score: min(1, liquidityScore * 5) bounds to [0, 1]
		// We convert [0, 1] to [-1, 1] by scaling and shifting
		liquidityScore: Math.min(1, factors.liquidityScore * 5) * 2 - 1,

		// Whale risk: convert to [0, 1] scale first (assuming 100% is max risk)
		// Then invert and map to [-1, 1] where -1 is high risk, 1 is low risk
		whaleRisk: (1 - Math.min(1, factors.whaleRisk / 100)) * 2 - 1,

		// RSI: normalize from [0, 100] to [-1, 1]
		rsi: normalizeRSI(factors.rsi),

		// Volatility: normalize to [0, 1] then to [-1, 1]
		// High volatility is negative, low volatility is positive
		volatility: (1 - normalizeVolatility(factors.volatility)) * 2 - 1,

		// VWAP deviation: tanh(vwapDev * 10) bounds to [-1, 1]
		vwapDeviation: Math.tanh(factors.vwapDeviation * 10),

		// Volatility-adjusted momentum
		volatilityAdjustedMomentum: Math.tanh(factors.volatilityAdjustedMomentum * 5)
	};
}

/**
 * Calculate weighted contributions of each factor
 */
function calculateFactorContributions(
	normalizedFactors: NormalizedFactors,
	weights: ModelWeights
): Record<keyof NormalizedFactors, number> {
	const contributions: Record<string, number> = {};

	// Apply weights to each normalized factor
	for (const [factor, value] of Object.entries(normalizedFactors)) {
		contributions[factor] = value * (weights[factor as keyof ModelWeights] || 0);
	}

	return contributions as Record<keyof NormalizedFactors, number>;
}
