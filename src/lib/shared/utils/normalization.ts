/**
 * Normalization utilities
 * Functions to normalize and scale trading indicators to standard ranges
 */

/**
 * Normalize a value to the range [-1, 1] using min-max scaling
 * @param value Value to normalize
 * @param min Expected minimum value
 * @param max Expected maximum value
 * @param clip Whether to clip the result to the [-1, 1] range
 */
export function normalizeMinMax(
	value: number,
	min: number,
	max: number,
	clip: boolean = true
): number {
	// Early return for invalid ranges
	if (max === min) return 0;

	// Linear scaling to [-1, 1]
	const normalized = 2 * ((value - min) / (max - min)) - 1;

	// Clip to [-1, 1] if requested
	if (clip) {
		return Math.max(-1, Math.min(1, normalized));
	}

	return normalized;
}

/**
 * Normalize a value using Z-score (mean and standard deviation)
 * With optional clipping to ensure results within [-1, 1]
 * @param value Value to normalize
 * @param mean Mean of the expected distribution
 * @param stdDev Standard deviation of the expected distribution
 * @param clip Whether to clip the result to the [-1, 1] range
 */
export function normalizeZScore(
	value: number,
	mean: number,
	stdDev: number,
	clip: boolean = true
): number {
	// Early return for zero standard deviation
	if (stdDev === 0) return 0;

	// Z-score calculation
	const zScore = (value - mean) / stdDev;

	// Standard z-scores often exceed [-1, 1], so we scale by dividing by 3
	// (assuming approximately normal distribution, ±3σ contains ~99.7% of data)
	const normalized = zScore / 3;

	// Clip to [-1, 1] if requested
	if (clip) {
		return Math.max(-1, Math.min(1, normalized));
	}

	return normalized;
}

/**
 * Normalize momentum to [-1, 1] range with percentages scaled appropriately
 * @param momentum Raw momentum value (% change)
 */
export function normalizeMomentum(momentum: number): number {
	// For price momenta, ±20% is quite significant in crypto
	return Math.tanh(momentum * 5); // tanh naturally bounds to [-1, 1]
}

/**
 * Normalize volume trend to [-1, 1]
 * @param volumeTrend Raw volume trend value (% change)
 */
export function normalizeVolumeTrend(volumeTrend: number): number {
	// Volume can spike significantly, use tanh to dampen extreme values
	return Math.tanh(volumeTrend * 3);
}

/**
 * Normalize flow imbalance from buy/sell values
 * @param buys Total buy volume/count
 * @param sells Total sell volume/count
 */
export function calculateFlowImbalance(buys: number, sells: number): number {
	const total = buys + sells;

	// Early return for no activity
	if (total === 0) return 0;

	// Calculate flow imbalance: range [-1, 1]
	// -1 = all sells, 0 = balanced, +1 = all buys
	return (buys - sells) / total;
}

/**
 * Normalize liquidity score (liquidity/mcap) to [0, 1]
 * @param liquidity Liquidity amount
 * @param mcap Market cap
 */
export function normalizeLiquidityScore(liquidity: number, mcap: number): number {
	// Early return for zero mcap
	if (mcap <= 0) return 0;

	// Calculate raw liquidity ratio
	const ratio = liquidity / mcap;

	// Normalize to [0, 1] range
	// Typical high-quality tokens might have 15-20% liquidity ratio
	return Math.min(1, ratio * 5);
}

/**
 * Normalize RSI from [0, 100] to [-1, 1]
 * This transforms RSI so that:
 * - 50 (neutral) becomes 0
 * - 0 (oversold) becomes -1
 * - 100 (overbought) becomes +1
 * @param rsi Raw RSI value in range [0, 100]
 */
export function normalizeRSI(rsi: number): number {
	return (rsi - 50) / 50;
}

/**
 * Normalize Bollinger Band width to [0, 1]
 * Used to measure volatility
 * @param bbWidth Raw bollinger band width (upper - lower)/middle
 */
export function normalizeVolatility(bbWidth: number): number {
	// Typical range for BB width in crypto is around 0.04-0.20
	// Scale up to get a more useful range
	return Math.min(1, bbWidth * 5);
}

/**
 * Calculate a volatility-adjusted momentum value
 * Diminishes the impact of large price movements during high volatility
 * @param momentum Normalized momentum value [-1, 1]
 * @param volatility Normalized volatility [0, 1]
 */
export function volatilityAdjustedMomentum(momentum: number, volatility: number): number {
	// Small epsilon to prevent division by zero
	const epsilon = 0.1;

	// Dampen momentum with increasing volatility
	return momentum / (volatility + epsilon);
}
