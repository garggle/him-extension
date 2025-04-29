/**
 * Extended trading model types
 * Enhances the shared trading-model types with additional fields
 */

import type { Decision } from '$lib/shared/entities/trading-model.js';

/**
 * Extended set of trading factors with additional technical indicators
 */
export interface EnhancedTradingFactors {
	// Original factors
	momentum: number;
	volumeTrend: number;
	flowImbalance: number; // Replaces flowRatio
	liquidityScore: number;
	whaleRisk: number;

	// Technical indicators
	rsi: number;
	volatility: number; // Based on Bollinger Bands width
	vwapDeviation: number; // % distance from VWAP
	volatilityAdjustedMomentum: number;
}

/**
 * Normalized version of the trading factors
 * All values are in the range [-1, 1]
 */
export interface NormalizedFactors {
	momentum: number;
	volumeTrend: number;
	flowImbalance: number;
	liquidityScore: number;
	whaleRisk: number;
	rsi: number;
	volatility: number;
	vwapDeviation: number;
	volatilityAdjustedMomentum: number;
}

/**
 * Enhanced model result with weighted contribution of each factor
 */
export interface EnhancedModelResult {
	decision: Decision;
	score: number;
	normalizedFactors: NormalizedFactors;
	rawFactors: EnhancedTradingFactors;
	factorContributions: Record<keyof NormalizedFactors, number>;
}

/**
 * Market data snapshot with combined metrics
 */
export interface MarketSnapshot {
	// Price metrics
	price: number;
	priceChange24h: number;

	// Volume metrics
	volume24h: number;
	volumeChange: number;

	// Buy/Sell metrics
	buyVolume: number;
	sellVolume: number;
	buyCount: number;
	sellCount: number;

	// Liquidity metrics
	liquidity: number;
	marketCap: number;

	// Risk metrics
	whalePercentage: number;
	developerPercentage: number;
	insiderPercentage: number;

	// Technical indicators
	rsi14: number;
	bbWidth: number;
	ema12: number;
	ema26: number;
	vwap: number;
}
