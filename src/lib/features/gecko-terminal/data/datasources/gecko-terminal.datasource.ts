/**
 * Data source for fetching data from GeckoTerminal API
 */
import type { GeckoOhlcvResponse, OhlcvData } from '../../entities/gecko-ohlcv.js';
import { createOhlcvData } from '../../entities/gecko-ohlcv.js';
import type { GeckoTradeResponse, TradeData } from '../../entities/gecko-trade.js';
import { createTradeData } from '../../entities/gecko-trade.js';

// Base URL for GeckoTerminal API
const GECKO_API_BASE_URL = 'https://api.geckoterminal.com/api/v2';

/**
 * Result of a GeckoTerminal data fetch operation
 */
export interface GeckoFetchResult {
	success: boolean;
	ohlcv?: OhlcvData[];
	trades?: TradeData[];
	error?: string;
}

/**
 * Fetches OHLCV and Trades data from GeckoTerminal API for a specific pool
 * @param poolAddress The address of the token pool
 * @param network The blockchain network, defaults to 'solana'
 * @param timeframe The OHLCV timeframe, defaults to 'minute'
 * @returns A promise resolving to the fetch result
 */
export async function fetchGeckoData(
	poolAddress: string,
	network: string = 'solana',
	timeframe: string = 'minute'
): Promise<GeckoFetchResult> {
	try {
		// Define API endpoints
		const ohlcvUrl = `${GECKO_API_BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}`;
		const tradesUrl = `${GECKO_API_BASE_URL}/networks/${network}/pools/${poolAddress}/trades`;

		// console.log('Fetching GeckoTerminal data:', { ohlcvUrl, tradesUrl });

		// Fetch both endpoints concurrently
		const [ohlcvResult, tradesResult] = await Promise.allSettled([
			fetch(ohlcvUrl),
			fetch(tradesUrl)
		]);

		let transformedOhlcvData: OhlcvData[] | undefined;
		let transformedTradeData: TradeData[] | undefined;
		let errorMessages: string[] = [];

		// Process OHLCV result
		if (ohlcvResult.status === 'fulfilled' && ohlcvResult.value.ok) {
			try {
				const rawOhlcvData: GeckoOhlcvResponse = await ohlcvResult.value.json();
				if (rawOhlcvData?.data?.attributes?.ohlcv_list) {
					transformedOhlcvData = rawOhlcvData.data.attributes.ohlcv_list.map(createOhlcvData);
				} else {
					errorMessages.push('OHLCV data structure is not as expected');
				}
			} catch (error) {
				errorMessages.push(
					`Error parsing OHLCV data: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		} else {
			const status =
				ohlcvResult.status === 'rejected'
					? 'request failed'
					: `HTTP status ${ohlcvResult.value.status}`;
			errorMessages.push(`OHLCV endpoint: ${status}`);
		}

		// Process Trades result
		if (tradesResult.status === 'fulfilled' && tradesResult.value.ok) {
			try {
				const rawTradesData: GeckoTradeResponse = await tradesResult.value.json();
				if (rawTradesData?.data && Array.isArray(rawTradesData.data)) {
					transformedTradeData = rawTradesData.data.map(createTradeData);
				} else {
					errorMessages.push('Trades data structure is not as expected');
				}
			} catch (error) {
				errorMessages.push(
					`Error parsing Trades data: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		} else {
			const status =
				tradesResult.status === 'rejected'
					? 'request failed'
					: `HTTP status ${tradesResult.value.status}`;
			errorMessages.push(`Trades endpoint: ${status}`);
		}

		// Decide overall success based on having at least one successful dataset
		const hasOhlcv = !!transformedOhlcvData && transformedOhlcvData.length > 0;
		const hasTrades = !!transformedTradeData && transformedTradeData.length > 0;

		if (hasOhlcv || hasTrades) {
			return {
				success: true,
				ohlcv: transformedOhlcvData,
				trades: transformedTradeData,
				error: errorMessages.length > 0 ? `Partial success: ${errorMessages.join('; ')}` : undefined
			};
		} else {
			return {
				success: false,
				error:
					errorMessages.length > 0
						? `Failed to fetch GeckoTerminal data: ${errorMessages.join('; ')}`
						: 'Unknown error fetching GeckoTerminal data'
			};
		}
	} catch (error) {
		console.error('Error in fetchGeckoData:', error);
		return {
			success: false,
			error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}
