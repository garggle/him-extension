/**
 * Technical indicators for trading analysis
 * Contains implementations of common technical indicators for OHLCV data
 */

import type { Candle } from '$lib/shared/entities/trading-model.js';

/**
 * Calculate Exponential Moving Average
 * @param candles Array of price candles
 * @param period The EMA period
 * @param key Property to use for calculation (defaults to close price)
 */
export function calculateEMA(
	candles: Candle[],
	period: number,
	key: keyof Pick<Candle, 'open' | 'high' | 'low' | 'close'> = 'close'
): number[] {
	if (candles.length < period) {
		return [];
	}

	const k = 2 / (period + 1);
	const emaResults: number[] = [];

	// Calculate initial SMA for seeding the EMA
	let sum = 0;
	for (let i = 0; i < period; i++) {
		sum += candles[i][key];
	}

	// First EMA value is SMA
	let ema = sum / period;
	emaResults.push(ema);

	// Calculate EMA for remaining periods
	for (let i = period; i < candles.length; i++) {
		ema = (candles[i][key] - ema) * k + ema;
		emaResults.push(ema);
	}

	return emaResults;
}

/**
 * Calculate Relative Strength Index
 * @param candles Array of price candles
 * @param period RSI period (typically 14)
 */
export function calculateRSI(candles: Candle[], period: number = 14): number[] {
	if (candles.length < period + 1) {
		return [];
	}

	const rsiValues: number[] = [];
	let gains = 0;
	let losses = 0;

	// Calculate initial avg gain/loss
	for (let i = 1; i <= period; i++) {
		const diff = candles[i].close - candles[i - 1].close;
		if (diff > 0) {
			gains += diff;
		} else {
			losses += Math.abs(diff);
		}
	}

	let avgGain = gains / period;
	let avgLoss = losses / period;

	// Calculate RSI using smoothed method
	for (let i = period + 1; i < candles.length; i++) {
		const diff = candles[i].close - candles[i - 1].close;
		let currentGain = 0;
		let currentLoss = 0;

		if (diff > 0) {
			currentGain = diff;
		} else {
			currentLoss = Math.abs(diff);
		}

		// Smooth averages
		avgGain = (avgGain * (period - 1) + currentGain) / period;
		avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

		// Prevent division by zero
		const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
		const rsi = 100 - 100 / (1 + rs);

		rsiValues.push(rsi);
	}

	return rsiValues;
}

/**
 * Calculate Average True Range
 * @param candles Array of price candles
 * @param period ATR period (typically 14)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
	if (candles.length < period + 1) {
		return [];
	}

	const trValues: number[] = [];

	// Calculate True Range for each candle
	for (let i = 1; i < candles.length; i++) {
		const high = candles[i].high;
		const low = candles[i].low;
		const prevClose = candles[i - 1].close;

		const tr1 = high - low;
		const tr2 = Math.abs(high - prevClose);
		const tr3 = Math.abs(low - prevClose);

		const tr = Math.max(tr1, tr2, tr3);
		trValues.push(tr);
	}

	// Calculate initial ATR using simple average
	let atr = trValues.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
	const atrValues: number[] = [atr];

	// Calculate ATR using smoothed method
	for (let i = period; i < trValues.length; i++) {
		atr = (atr * (period - 1) + trValues[i]) / period;
		atrValues.push(atr);
	}

	return atrValues;
}

/**
 * Calculate Volume Weighted Average Price for each candle over period
 * @param candles Array of price candles
 * @param period VWAP period (0 for entire data range)
 */
export function calculateVWAP(candles: Candle[], period: number = 0): number[] {
	if (candles.length === 0) {
		return [];
	}

	const vwapValues: number[] = [];
	const range = period === 0 ? candles.length : Math.min(period, candles.length);

	for (let i = 0; i < candles.length; i++) {
		const startIdx = period === 0 ? 0 : Math.max(0, i - range + 1);

		let volumeSum = 0;
		let priceVolumeSum = 0;

		for (let j = startIdx; j <= i; j++) {
			const candle = candles[j];
			const typicalPrice = (candle.high + candle.low + candle.close) / 3;
			priceVolumeSum += typicalPrice * candle.volume;
			volumeSum += candle.volume;
		}

		const vwap = volumeSum > 0 ? priceVolumeSum / volumeSum : candles[i].close;
		vwapValues.push(vwap);
	}

	return vwapValues;
}

/**
 * Calculate Bollinger Bands (middle, upper, lower) bands
 * @param candles Array of price candles
 * @param period Period for the bands (typically 20)
 * @param multiplier Standard deviation multiplier (typically 2)
 */
export function calculateBollingerBands(
	candles: Candle[],
	period: number = 20,
	multiplier: number = 2
): {
	middle: number[];
	upper: number[];
	lower: number[];
	width: number[];
} {
	if (candles.length < period) {
		return { middle: [], upper: [], lower: [], width: [] };
	}

	const middle: number[] = [];
	const upper: number[] = [];
	const lower: number[] = [];
	const width: number[] = [];

	// Calculate SMA and bands for each valid position
	for (let i = period - 1; i < candles.length; i++) {
		let sum = 0;
		for (let j = i - period + 1; j <= i; j++) {
			sum += candles[j].close;
		}

		const sma = sum / period;

		// Calculate standard deviation
		let sumSquares = 0;
		for (let j = i - period + 1; j <= i; j++) {
			sumSquares += Math.pow(candles[j].close - sma, 2);
		}

		const stdDev = Math.sqrt(sumSquares / period);

		const upperBand = sma + multiplier * stdDev;
		const lowerBand = sma - multiplier * stdDev;
		const bandWidth = (upperBand - lowerBand) / sma; // Normalized width

		middle.push(sma);
		upper.push(upperBand);
		lower.push(lowerBand);
		width.push(bandWidth);
	}

	return { middle, upper, lower, width };
}
