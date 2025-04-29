/**
 * Enhanced trading analysis service
 * Provides functions to analyze trading opportunities with advanced indicators
 */

import type { AxiomTokenData } from '$lib/features/axiom/entities/token-data.js';
import type { OhlcvData } from '$lib/features/gecko-terminal/entities/gecko-ohlcv.js';
import type { TradeData } from '$lib/features/gecko-terminal/entities/gecko-trade.js';
import { type Candle, type Snapshot, type Trade } from '$lib/shared/entities/trading-model.js';
import { analyzeEnhancedTradingOpportunity } from '../entities/enhanced-trading-model.js';
import type { EnhancedModelResult } from '../entities/trading-types.js';
import { analyzeMultiPeriodFlow, detectUnusualPatterns } from './flow-analysis.js';

/**
 * Converts AxiomTokenData to the Snapshot format required by the trading model
 * This is the same as in the original trading-analysis.ts
 */
export function convertAxiomDataToSnapshot(axiomData: AxiomTokenData): Snapshot {
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
			sellers: axiomData.timestamped.sellers || '0',
			timeframe: axiomData.timestamped.timeframe || '1h',
			netVolume: axiomData.timestamped.netVolume || '0'
		}
	};
}

/**
 * Converts OhlcvData to the Candle format required by the trading model
 * This is the same as in the original trading-analysis.ts
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
 * This is the same as in the original trading-analysis.ts
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
 * Analyzes trading opportunity with available data using the enhanced model
 * @param axiomData Token data from Axiom
 * @param ohlcvData OHLCV data from GeckoTerminal (optional)
 * @param tradeData Trade data from GeckoTerminal (optional)
 * @returns Enhanced model result and market manipulation warnings
 */
export function analyzeEnhancedTradingData(
	axiomData: AxiomTokenData,
	ohlcvData?: OhlcvData[],
	tradeData?: TradeData[]
): {
	modelResult: EnhancedModelResult;
	manipulationWarnings: string[];
	manipulationScore: number;
} {
	// Convert data to the format expected by the trading model
	const snapshot = convertAxiomDataToSnapshot(axiomData);
	const candles = ohlcvData ? convertOhlcvToCandles(ohlcvData) : [];
	const trades = tradeData ? convertTradeData(tradeData) : [];

	// Analyze multi-period flow (short, medium, long term)
	const flowAnalysis = analyzeMultiPeriodFlow(trades);

	// Detect unusual patterns and manipulation
	const manipulationAnalysis = detectUnusualPatterns(flowAnalysis);

	// Analyze the trading opportunity with the enhanced model
	const modelResult = analyzeEnhancedTradingOpportunity(snapshot, candles, trades);

	return {
		modelResult,
		manipulationWarnings: manipulationAnalysis.warnings,
		manipulationScore: manipulationAnalysis.manipulationScore
	};
}

/**
 * Get an explanation of the model's decision based on the factors
 * @param result Enhanced model result
 * @returns Human-readable explanation
 */
export function explainModelDecision(result: EnhancedModelResult): string {
	const { decision, score, factorContributions } = result;

	// Sort factors by absolute contribution (most influential first)
	const sortedFactors = Object.entries(factorContributions)
		.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
		.slice(0, 3); // Take top 3 factors

	// Create explanation based on decision and top factors
	let explanation = `The model ${
		decision === 'BUY'
			? 'recommends buying'
			: decision === 'SELL'
				? 'recommends selling'
				: 'suggests holding'
	} with a confidence of ${Math.abs(score * 100).toFixed(1)}%. `;

	explanation += 'Key factors: ';

	// Add explanation for each top factor
	sortedFactors.forEach(([factor, value], index) => {
		// Skip factors with negligible impact
		if (Math.abs(value) < 0.05) return;

		if (index > 0) explanation += ', ';

		const impact = value > 0 ? 'positive' : 'negative';
		const readableFactor = getReadableFactorName(factor);

		explanation += `${readableFactor} (${impact})`;
	});

	return explanation;
}

/**
 * Get a human-readable name for a factor
 */
function getReadableFactorName(factorKey: string): string {
	const factorNames: Record<string, string> = {
		momentum: 'price momentum',
		volumeTrend: 'volume trend',
		flowImbalance: 'buy/sell ratio',
		liquidityScore: 'liquidity ratio',
		whaleRisk: 'whale concentration',
		rsi: 'overbought/oversold',
		volatility: 'price stability',
		vwapDeviation: 'VWAP deviation',
		volatilityAdjustedMomentum: 'risk-adjusted momentum'
	};

	return factorNames[factorKey] || factorKey;
}
