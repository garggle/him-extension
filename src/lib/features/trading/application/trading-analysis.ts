/**
 * Trading analysis utility
 * Provides functions to analyze trading opportunities with available data
 */

import type { AxiomTokenData } from '$lib/features/axiom/entities/token-data.js';
import type { OhlcvData } from '$lib/features/gecko-terminal/entities/gecko-ohlcv.js';
import type { TradeData } from '$lib/features/gecko-terminal/entities/gecko-trade.js';
import {
	analyzeTradingOpportunity,
	type Candle,
	type ModelResult,
	type Snapshot,
	type Trade
} from '$lib/shared/entities/trading-model.js';

/**
 * Converts AxiomTokenData to the Snapshot format required by the trading model
 */
export function convertAxiomDataToSnapshot(axiomData: AxiomTokenData): Snapshot {
	// Create a snapshot from the AxiomTokenData
	return {
		userTrading: {
			bought: axiomData.userTrading.bought || '0',
			sold: axiomData.userTrading.sold || '0',
			holding: axiomData.userTrading.holding || '0',
			pnl: axiomData.userTrading.pnl || '0%',
			balance: axiomData.userTrading.balance || '0'
		},
		tokenInfo: {
			top10Holders: axiomData.tokenInfo.top10Holders || '0%',
			developerHolding: axiomData.tokenInfo.developerHolding || '0%',
			sniperHolding: axiomData.tokenInfo.sniperHolding || '0%',
			insiderHoldings: axiomData.tokenInfo.insiderHoldings || '0%',
			bundlers: axiomData.tokenInfo.bundlers || '0',
			lpBurned: axiomData.tokenInfo.lpBurned || '0%',
			holders: axiomData.tokenInfo.holders || '0',
			proTraders: axiomData.tokenInfo.proTraders || '0',
			dexPaid: axiomData.tokenInfo.dexPaid || '0'
		},
		overall: {
			mcap: axiomData.overall.mcap || '0',
			price: axiomData.overall.price || '0',
			liquidity: axiomData.overall.liquidity || '0',
			totalSupply: axiomData.overall.totalSupply || '0'
		},
		timestamped: {
			volume: axiomData.timestamped.volume || '0',
			buyers: axiomData.timestamped.buyers || '0',
			sellers: axiomData.timestamped.sellers || '0'
		}
	};
}

/**
 * Converts OhlcvData to the Candle format required by the trading model
 */
export function convertOhlcvToCandles(ohlcvData: OhlcvData[]): Candle[] {
	return ohlcvData.map((item) => ({
		timestamp: item.timestamp,
		open: item.open,
		high: item.high,
		low: item.low,
		close: item.close,
		volume: item.volume
	}));
}

/**
 * Converts TradeData to the Trade format required by the trading model
 */
export function convertTradeData(tradeData: TradeData[]): Trade[] {
	return tradeData.map((item) => ({
		timestamp: new Date(item.timestamp * 1000).toISOString(), // Convert Unix timestamp to ISO string
		type: item.type,
		price: item.price,
		amount: item.amount,
		txHash: item.txHash
	}));
}

/**
 * Analyzes trading opportunity with available data
 * Works with either complete data (Axiom + Gecko) or just Axiom data
 */
export function analyzeTradingData(
	axiomData: AxiomTokenData,
	ohlcvData?: OhlcvData[],
	tradeData?: TradeData[]
): ModelResult {
	// Convert data to the format expected by the trading model
	const snapshot = convertAxiomDataToSnapshot(axiomData);
	const candles = ohlcvData ? convertOhlcvToCandles(ohlcvData) : [];
	const trades = tradeData ? convertTradeData(tradeData) : [];

	// Analyze the data
	return analyzeTradingOpportunity(snapshot, candles, trades);
}
