/**
 * Trading model configuration
 * Model parameters and settings that can be adjusted without changing business logic
 */

/**
 * Model weights for each trading factor
 * Each weight determines how much influence that factor has on the final decision
 */
export interface ModelWeights {
	// Classic factors
	momentum: number;
	volumeTrend: number;
	flowImbalance: number; // Replaces flowRatio
	liquidityScore: number;
	whaleRisk: number;

	// New technical factors
	rsi: number;
	volatility: number;
	vwapDeviation: number;
	volatilityAdjustedMomentum: number;
}

/**
 * Threshold values for buy/sell decisions
 */
export interface ModelThresholds {
	buy: number;
	sell: number;
}

/**
 * Periods for technical indicators
 */
export interface IndicatorPeriods {
	shortEMA: number;
	longEMA: number;
	rsi: number;
	atr: number;
	vwap: number;
	bollingerBands: number;
}

/**
 * Default weights for the trading model
 * Values should sum to 1.0 for easy interpretation
 */
export const DEFAULT_WEIGHTS: ModelWeights = {
	// Classic factors
	momentum: 0.15,
	volumeTrend: 0.1,
	flowImbalance: 0.15,
	liquidityScore: 0.1,
	whaleRisk: 0.1,

	// New technical factors
	rsi: 0.1,
	volatility: 0.1,
	vwapDeviation: 0.1,
	volatilityAdjustedMomentum: 0.1
};

/**
 * Default threshold values for making trading decisions
 * Using tanh for scoring, these are the cutoffs for BUY/SELL recommendations
 */
export const DEFAULT_THRESHOLDS: ModelThresholds = {
	buy: 0.3, // Was 0.15
	sell: -0.3 // Was -0.15
};

/**
 * Default periods for calculating technical indicators
 */
export const DEFAULT_PERIODS: IndicatorPeriods = {
	shortEMA: 12,
	longEMA: 26,
	rsi: 14,
	atr: 14,
	vwap: 24, // One day on hourly candles
	bollingerBands: 20
};

/**
 * Standard scaling factors for raw indicators
 * Used to normalize values before applying model weights
 */
export const SCALING_FACTORS = {
	// For price % change normalization (momentum)
	momentumScale: 5.0,

	// For volume % change normalization
	volumeScale: 3.0,

	// For liquidity/mcap ratio (typical range 0.05-0.20)
	liquidityScale: 5.0,

	// For VWAP deviation normalization
	vwapScale: 10.0,

	// For volatility (BB width) normalization
	volatilityScale: 5.0
};
