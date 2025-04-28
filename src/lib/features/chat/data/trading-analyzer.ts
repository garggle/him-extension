/**
 * Trading Analyzer service for the Chrome extension
 * Handles sending trade analysis data to OpenAI API and getting advice
 */

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
	};
}

/**
 * Formats the analysis data into a readable prompt for OpenAI
 */
function formatAnalysisPrompt(analysisResult: AnalysisResult, snapshot?: TokenSnapshot): string {
	// Start with the model's decision and score
	let prompt = `Analyze this token trading opportunity:

MODEL RECOMMENDATION: ${analysisResult.decision} (Score: ${analysisResult.score.toFixed(2)})

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
- Price: ${snapshot.overall.price}
- Liquidity: ${snapshot.overall.liquidity}
- Volume: ${snapshot.timestamped.volume}
- Buyers/Sellers: ${snapshot.timestamped.buyers}/${snapshot.timestamped.sellers}
- Top 10 Holders: ${snapshot.tokenInfo.top10Holders}
- Insider Holdings: ${snapshot.tokenInfo.insiderHoldings}`;
	}

	// Add request for advice
	prompt += `

Based on these indicators and metrics, what should I do on this SOLANA memecoin? Give me very practical memecoin trading advice in a natural, conversational tone. Consider risk levels, timing, and potential strategies. First give what I should do, then explain why. But be concise. Don't use more than 15 sentences.`;

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
 * Sends trading analysis data to OpenAI and returns the advice
 */
export async function getTradeAdvice(
	analysisResult: AnalysisResult,
	snapshot?: TokenSnapshot
): Promise<string> {
	try {
		// Format the data into a prompt
		const prompt = formatAnalysisPrompt(analysisResult, snapshot);

		// Send to OpenAI API with an empty history (no context needed)
		return await sendChatRequest(prompt, []);
	} catch (error) {
		console.error('Error getting trade advice:', error);
		throw error;
	}
}
