/**
 * Types for GeckoTerminal OHLCV data
 */

/**
 * Raw response from GeckoTerminal OHLCV API
 */
export interface GeckoOhlcvResponse {
	data: {
		id: string;
		type: 'ohlcv_response';
		attributes: {
			ohlcv_list: [number, string, string, string, string, string][]; // [timestamp, open, high, low, close, volume]
		};
	};
}

/**
 * Processed OHLCV data with numeric values for ease of use
 */
export interface OhlcvData {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

/**
 * Factory method to create OhlcvData from raw API response
 */
export function createOhlcvData(
	rawData: [number, string, string, string, string, string]
): OhlcvData {
	return {
		timestamp: rawData[0],
		open: parseFloat(rawData[1]),
		high: parseFloat(rawData[2]),
		low: parseFloat(rawData[3]),
		close: parseFloat(rawData[4]),
		volume: parseFloat(rawData[5])
	};
}
