/**
 * Trading Analyzer service for the Chrome extension
 * Handles sending trade analysis data to OpenAI API and getting advice
 */

import {
	type EnhancedAnalysisResult,
	type NormalizedFactors
} from '$lib/features/trading/index.js';
import { sendChatRequest } from './openai-api.js';

// Interface for analysis result from the content script
export interface AnalysisResult {
	decision: string;
	score: number;
	factors: {
		momentum: number;
		volumeTrend: number;
		flowRatio: number;
		liquidityScore: number;
		whaleRisk: number;
	};
}

// Interface for token snapshot data from Axiom
export interface TokenSnapshot {
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
		timeframe: string;
		netVolume: string;
	};
}

/**
 * Get a human-readable name for a factor
 */
function getReadableFactorName(factorKey: keyof NormalizedFactors): string {
	const factorNames: Record<keyof NormalizedFactors, string> = {
		momentum: 'Momentum',
		volumeTrend: 'Volume Trend',
		flowImbalance: 'Buy/Sell Flow',
		liquidityScore: 'Liquidity',
		whaleRisk: 'Whale Risk',
		rsi: 'RSI',
		volatility: 'Volatility',
		vwapDeviation: 'VWAP Deviation',
		volatilityAdjustedMomentum: 'Risk-Adjusted Momentum'
	};

	return factorNames[factorKey];
}

/**
 * Formats the enhanced analysis data into a readable prompt for OpenAI
 */
function formatEnhancedAnalysisPrompt(
	enhancedResult: EnhancedAnalysisResult,
	snapshot?: TokenSnapshot
): string {
	const { modelResult, manipulationWarnings, manipulationScore } = enhancedResult;
	const { decision, score, normalizedFactors, factorContributions } = modelResult;

	// Start with the model's decision and score
	let prompt = `Analyze this token trading opportunity:

MODEL RECOMMENDATION: ${decision} (Score: ${score.toFixed(2)})

KEY INDICATORS:`;

	// Add all normalized factors
	(Object.keys(normalizedFactors) as Array<keyof NormalizedFactors>).forEach((key) => {
		const value = normalizedFactors[key];
		const contribution = factorContributions[key];
		const isPositiveOnly = key === 'liquidityScore';
		const isNegativeBetter = key === 'whaleRisk';

		// Calculate indicator status
		const status = getIndicatorStatus(isNegativeBetter ? -value : value, isPositiveOnly);

		// Add factor line with contribution
		prompt += `\n- ${getReadableFactorName(key)}: ${value.toFixed(2)} (${status}, Impact: ${(contribution * 100).toFixed(1)}%)`;
	});

	// Add manipulation warnings if any
	if (manipulationWarnings.length > 0 || manipulationScore > 0) {
		prompt += `\n\nMANIPULATION ANALYSIS:
- Risk Score: ${manipulationScore.toFixed(2)} (${getManipulationLevel(manipulationScore)})`;

		if (manipulationWarnings.length > 0) {
			prompt += `\n- Warnings: ${manipulationWarnings.join('; ')}`;
		}
	}

	// Add token snapshot data if available
	if (snapshot) {
		prompt += `\n
TOKEN METRICS:
- Market Cap: ${snapshot.overall.mcap}
- Price: ${snapshot.overall.price} (1st number which is not 0 after decimal point means the number of 0 after decimal point)
- Liquidity: ${snapshot.overall.liquidity}
- Volume: ${snapshot.timestamped.volume}
- Net Volume: ${snapshot.timestamped.netVolume} in last ${snapshot.timestamped.timeframe}
- Buyers/Sellers: ${snapshot.timestamped.buyers}/${snapshot.timestamped.sellers} in last ${snapshot.timestamped.timeframe}
- Top 10 Holders %: ${snapshot.tokenInfo.top10Holders}
- Insider Holdings %: ${snapshot.tokenInfo.insiderHoldings}
- Developer Holdings %: ${snapshot.tokenInfo.developerHolding}
- Sniper Holdings %: ${snapshot.tokenInfo.sniperHolding}
- Bundlers %: ${snapshot.tokenInfo.bundlers}
- LP Burned %: ${snapshot.tokenInfo.lpBurned}
- Holders: ${snapshot.tokenInfo.holders}
- Pro Traders: ${snapshot.tokenInfo.proTraders}
- Dexscreener Paid: ${snapshot.tokenInfo.dexPaid}`;
	}

	// Add request for advice
	prompt += `\n
Based on these indicators, metrics, and manipulation analysis, what should I do on this SOLANA memecoin? Give me very practical memecoin trading advice in a natural, conversational tone. Give numbers and percentages to aim for PnL, Stop Loss, Take Profit. Consider risk levels, timing, and potential strategies. First give what I should do, then explain why. But be concise. Produce 5 sentences or less. No newlines. Make the first message start with "Action:"`;

	return prompt;
}

/**
 * Helper function to get status description based on indicator value
 */
function getIndicatorStatus(value: number, isPositiveOnly: boolean = false): string {
	if (isPositiveOnly) {
		if (value >= 0.8) return 'Excellent';
		if (value >= 0.5) return 'Good';
		if (value >= 0.3) return 'Moderate';
		return 'Low';
	} else {
		if (value >= 0.5) return 'Bullish';
		if (value >= 0.1) return 'Slightly Bullish';
		if (value > -0.1) return 'Neutral';
		if (value > -0.5) return 'Slightly Bearish';
		return 'Bearish';
	}
}

/**
 * Helper function to get manipulation level description
 */
function getManipulationLevel(score: number): string {
	if (score < 0.2) return 'Low';
	if (score < 0.5) return 'Moderate';
	if (score < 0.8) return 'High';
	return 'Extreme';
}

/**
 * Sends enhanced trading analysis data to OpenAI and returns the advice
 */
export async function getEnhancedTradeAdvice(
	enhancedResult: EnhancedAnalysisResult,
	snapshot?: TokenSnapshot
): Promise<string> {
	try {
		// Format the data into a prompt
		const prompt = formatEnhancedAnalysisPrompt(enhancedResult, snapshot);

		// Send to OpenAI API with an empty history (no context needed)
		return await sendChatRequest(prompt, []);
	} catch (error) {
		console.error('Error getting enhanced trade advice:', error);
		throw error;
	}
}

/**
 * Sends trading analysis data to OpenAI and returns the advice
 * @deprecated Use getEnhancedTradeAdvice instead with EnhancedAnalysisResult
 */
export async function getTradeAdvice(
	analysisResult: any,
	snapshot?: TokenSnapshot
): Promise<string> {
	console.warn(
		'getTradeAdvice is deprecated. Use getEnhancedTradeAdvice with EnhancedAnalysisResult instead.'
	);
	try {
		// If we accidentally get an enhanced result, use the enhanced function
		if (analysisResult.modelResult && analysisResult.manipulationWarnings) {
			return getEnhancedTradeAdvice(analysisResult, snapshot);
		}

		// Legacy format handling
		const prompt = formatLegacyAnalysisPrompt(analysisResult, snapshot);
		return await sendChatRequest(prompt, []);
	} catch (error) {
		console.error('Error getting trade advice:', error);
		throw error;
	}
}

/**
 * Legacy method for backwards compatibility
 */
function formatLegacyAnalysisPrompt(analysisResult: any, snapshot?: TokenSnapshot): string {
	// Start with the model's decision and score
	let prompt = `Analyze this token trading opportunity:

KEY INDICATORS:
- Momentum: ${analysisResult.factors.momentum.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.momentum)})
- Volume Trend: ${analysisResult.factors.volumeTrend.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.volumeTrend)})
- Buy/Sell Flow: ${analysisResult.factors.flowRatio.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.flowRatio)})
- Liquidity Score: ${analysisResult.factors.liquidityScore.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.liquidityScore, true)})
- Whale Risk: ${analysisResult.factors.whaleRisk.toFixed(2)} (${getIndicatorStatus(-analysisResult.factors.whaleRisk)})`;

	// Add token snapshot data if available
	if (snapshot) {
		prompt += `

TOKEN METRICS:
- Market Cap: ${snapshot.overall.mcap}
- Price: ${snapshot.overall.price} (1st number which is not 0 after decimal point means the number of 0 after decimal point)
- Liquidity: ${snapshot.overall.liquidity}
- Volume: ${snapshot.timestamped.volume}
- Net Volume: ${snapshot.timestamped.netVolume}
- Buyers/Sellers: ${snapshot.timestamped.buyers}/${snapshot.timestamped.sellers} in last ${snapshot.timestamped.timeframe}
- Top 10 Holders %: ${snapshot.tokenInfo.top10Holders}
- Insider Holdings %: ${snapshot.tokenInfo.insiderHoldings}
- Developer Holdings %: ${snapshot.tokenInfo.developerHolding}
- Sniper Holdings %: ${snapshot.tokenInfo.sniperHolding}
- Bundlers %: ${snapshot.tokenInfo.bundlers}
- LP Burned %: ${snapshot.tokenInfo.lpBurned}
- Holders: ${snapshot.tokenInfo.holders}
- Pro Traders: ${snapshot.tokenInfo.proTraders}
- Dexscreener Paid: ${snapshot.tokenInfo.dexPaid}`;
	}

	// Add request for advice
	prompt += `

Based on these indicators and metrics, what should I do on this SOLANA memecoin? Give me very practical memecoin trading advice in a natural, conversational tone. Give numbers and percentages to aim for PnL, Stop Loss, Take Profit. Consider risk levels, timing, and potential strategies. First give what I should do, then explain why. But be concise. Produce 5 sentences or less. No newlines. Make the first message start with "Action:"`;

	return prompt;
}
