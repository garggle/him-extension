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
	chartImage?: string; // Optional base64 image of the chart
}

// --- START: Card Structure Interfaces ---

interface ActionStrategyCard {
	header: `✅ Strategy: ${string}` | `❌ Avoid for Now` | `⚠️ Entry only if dip`;
	body: {
		entry: string; // e.g., "Now", "On -5% dip"
		tp_sl: string; // e.g., "+15% / -8%"
		timeframe: string; // e.g., "Hold 5–30min", "1–2hr", "wait for next volume spike"
	};
	metrics: string[]; // e.g., ["Net volume", "Buyers/sellers", ...]
}

interface LiquidityPumpCard {
	header: `✨ Liquidity Health: ${'Good' | 'Moderate' | 'Low' | string}`; // Allow other statuses
	body: {
		mcap: string; // e.g., "$100k"
		liquidity: string; // e.g., "$100k"
		net_volume: string; // e.g., "+$50k in 1h"
		buyer_seller_ratio: string; // e.g., "150/50"
		interpretation: string; // e.g., "Volume high, but seller count too low = suspicious pump."
	};
	metrics: string[]; // e.g., ["Liquidity", "Buyer/seller", ...]
}

interface HolderStructureCard {
	header: `👥 Holder Risk: ${'High Turnover' | 'Concentrated' | 'Healthy Distribution' | string}`; // Allow other statuses
	body: {
		holders: string; // e.g., "500"
		pro_traders: string; // e.g., "25"
		top_10_pct: string; // e.g., "60%"
		interpretation: string; // e.g., "Too many pros, not enough sticky hands."
	};
	metrics: string[]; // e.g., ["Holders", "Pro Traders", ...]
}

interface ManipulationRiskCard {
	header: `🐳 Manipulation Risk: ${'Low' | 'Medium' | 'High' | 'Extreme'}`;
	body: {
		insider_pct: string; // e.g., "5%"
		dev_pct: string; // e.g., "1%"
		snipers_pct: string; // e.g., "10%"
		lp_burned_pct: string; // e.g., "100%"
		bundlers_pct: string; // e.g., "2%"
		interpretation: string; // e.g., "No dev bag = safer, but snipers present = fast out risk."
	};
	metrics: string[]; // e.g., ["Insider %", "Dev %", ...]
}

interface FinalCallCard {
	header: `🚨 Final Call: ${'High Exit Risk' | 'Potential Upside' | 'Monitor Closely' | string}`; // Allow other statuses
	body: {
		based_on: string[] // e.g., ["Volume behavior", "Lack of holders", ...]// e.g., "High risk of dump once hype fades. Wait for organic volume."
	};
	metrics: string[]; // e.g., ["Volume trend", "Buyer/seller ratio", ...]
}

// Overall structure for the JSON response
export interface TradingAdviceCards {
	actionStrategy: ActionStrategyCard;
	liquidityPump: LiquidityPumpCard;
	holderStructure: HolderStructureCard;
	manipulationRisk: ManipulationRiskCard;
	finalCall: FinalCallCard;
}

// --- END: Card Structure Interfaces ---

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
 * instructing it to return a structured JSON.
 */
function formatEnhancedAnalysisPrompt(
	enhancedResult: EnhancedAnalysisResult,
	snapshot?: TokenSnapshot
): string {
	const { modelResult, manipulationWarnings, manipulationScore } = enhancedResult;
	const { decision, score, normalizedFactors, factorContributions } = modelResult;

	// Start with context: Model recommendation, key indicators, manipulation analysis
	let context = `Trading Opportunity Analysis Context:

MODEL RECOMMENDATION: ${decision} (Score: ${score.toFixed(2)})

KEY INDICATORS:`;

	// Add all normalized factors
	(Object.keys(normalizedFactors) as Array<keyof NormalizedFactors>).forEach((key) => {
		const value = normalizedFactors[key];
		const contribution = factorContributions[key];
		const isPositiveOnly = key === 'liquidityScore';
		const isNegativeBetter = key === 'whaleRisk';
		const status = getIndicatorStatus(isNegativeBetter ? -value : value, isPositiveOnly);
		context += `\n- ${getReadableFactorName(key)}: ${value.toFixed(2)} (${status}, Impact: ${(contribution * 100).toFixed(1)}%)`;
	});

	// Add manipulation analysis
	if (manipulationWarnings.length > 0 || manipulationScore > 0) {
		context += `\n\nMANIPULATION ANALYSIS:
- Risk Score: ${manipulationScore.toFixed(2)} (${getManipulationLevel(manipulationScore)})`;
		if (manipulationWarnings.length > 0) {
			context += `\n- Warnings: ${manipulationWarnings.join('; ')}`;
		}
	} else {
		context += `\n\nMANIPULATION ANALYSIS: Risk Score: ${manipulationScore.toFixed(2)} (Low)`;
	}

	// Add token snapshot data if available
	if (snapshot) {
		context += `\n
TOKEN METRICS:
- Market Cap: ${snapshot.overall.mcap}
- Price: ${snapshot.overall.price}
- Liquidity: ${snapshot.overall.liquidity}
- Total Supply: ${snapshot.overall.totalSupply}
- Volume (${snapshot.timestamped.timeframe}): ${snapshot.timestamped.volume}
- Net Volume (${snapshot.timestamped.timeframe}): ${snapshot.timestamped.netVolume}
- Buyers/Sellers (${snapshot.timestamped.timeframe}): ${snapshot.timestamped.buyers}/${snapshot.timestamped.sellers}
- Top 10 Holders %: ${snapshot.tokenInfo.top10Holders}
- Insider Holdings %: ${snapshot.tokenInfo.insiderHoldings}
- Developer Holdings %: ${snapshot.tokenInfo.developerHolding}
- Sniper Holdings %: ${snapshot.tokenInfo.sniperHolding}
- Bundlers %: ${snapshot.tokenInfo.bundlers}
- LP Burned %: ${snapshot.tokenInfo.lpBurned}
- Holders: ${snapshot.tokenInfo.holders}
- Pro Traders: ${snapshot.tokenInfo.proTraders}
- Dexscreener Paid: ${snapshot.tokenInfo.dexPaid}`;

		// Add chart image if available
		if (snapshot.chartImage) {
			context += `\n\nCHART VISUAL ANALYSIS:
[This is a chart image in base64 format. Please analyze the price action, volume patterns, support/resistance levels, and any notable chart patterns visible.]
${snapshot.chartImage}`;
		}
	}

	// Instructions for the LLM to generate JSON
	const instructions = `
INSTRUCTIONS:
Based *only* on the provided Trading Opportunity Analysis Context, generate a JSON object containing practical advice for trading this SOLANA memecoin.
The JSON object MUST strictly follow this structure:
{
  "actionStrategy": { "header": string, "body": { "entry": string, "tp_sl": string, "timeframe": string }, "metrics": string[] },
  "liquidityPump": { "header": string, "body": { "mcap": string, "liquidity": string, "net_volume": string, "buyer_seller_ratio": string, "interpretation": string }, "metrics": string[] },
  "holderStructure": { "header": string, "body": { "holders": string, "pro_traders": string, "top_10_pct": string, "interpretation": string }, "metrics": string[] },
  "manipulationRisk": { "header": string, "body": { "insider_pct": string, "dev_pct": string, "snipers_pct": string, "lp_burned_pct": string, "bundlers_pct": string, "interpretation": string }, "metrics": string[] },
  "finalCall": { "header": string, "body": { "based_on": string[] }, "metrics": string[] }
}

- Headers should follow the examples: "✅ Strategy: ...", "✨ Liquidity Health: ...", "👥 Holder Risk: ...", "🐳 Manipulation Risk: ...", "⚠️ Final Call: ..."
- Populate the body fields using the provided context. Be concise and specific (e.g., give percentages for TP/SL). Assume a standard memecoin goal of >60% profit if buying. More than 100% and 200% is possible.
- The 'metrics' arrays should list the key data points from the context that informed each card's analysis.
- Respond ONLY with the JSON object. Do not include any other text, greetings, or explanations before or after the JSON. Ensure the JSON is valid.
`;

	// Combine context and instructions into the final prompt
	const prompt = context + instructions;
	// console.log('Generated Prompt for OpenAI:', prompt); // Optional: for debugging
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
 * Sends enhanced trading analysis data to OpenAI and returns the structured advice object
 */
export async function getEnhancedTradeAdvice(
	enhancedResult: EnhancedAnalysisResult,
	snapshot?: TokenSnapshot
): Promise<TradingAdviceCards> {
	try {
		// Format the data into a prompt requesting JSON
		const prompt = formatEnhancedAnalysisPrompt(enhancedResult, snapshot);

		const jsonResponseString = await sendChatRequest(prompt, [], true);

		// Parse the JSON response
		const adviceCards = JSON.parse(jsonResponseString) as TradingAdviceCards;
		return adviceCards;
	} catch (error) {
		console.error('Error getting or parsing enhanced trade advice:', error);
		// Consider returning a default error structure or re-throwing
		throw new Error('Failed to get or parse trade advice from AI.');
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
			const cards = await getEnhancedTradeAdvice(analysisResult, snapshot);
			// Convert cards to string JSON for backward compatibility
			return JSON.stringify(cards);
		}

		// Legacy format handling
		const prompt = formatLegacyAnalysisPrompt(analysisResult, snapshot);
		const jsonResponseString = await sendChatRequest(prompt, [], true);

		try {
			// Try to parse the response as JSON
			JSON.parse(jsonResponseString);
			// If it successfully parses, return it directly
			return jsonResponseString;
		} catch (parseError) {
			// If it fails to parse, it's probably a text response, wrap it in a basic JSON structure
			console.warn('Legacy API returned non-JSON response, converting to legacy format');
			const legacyText = jsonResponseString.trim();
			return JSON.stringify({
				legacyFormat: true,
				text: legacyText
			});
		}
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
	let context = `Trading Opportunity Analysis Context:

KEY INDICATORS:
- Momentum: ${analysisResult.factors.momentum.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.momentum)})
- Volume Trend: ${analysisResult.factors.volumeTrend.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.volumeTrend)})
- Liquidity Score: ${analysisResult.factors.liquidityScore.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.liquidityScore, true)})
- Whale Risk: ${analysisResult.factors.whaleRisk.toFixed(2)} (${getIndicatorStatus(-analysisResult.factors.whaleRisk)})`;

	// Add token snapshot data if available
	if (snapshot) {
		context += `

TOKEN METRICS:
- Market Cap: ${snapshot.overall.mcap}
- Price: ${snapshot.overall.price} (1st number which is not 0 after decimal point means the number of 0 after decimal point)
- Liquidity: ${snapshot.overall.liquidity}
- Volume: ${snapshot.timestamped.volume}
- Net Volume: ${snapshot.timestamped.netVolume}
- Buyers/Sellers: ${snapshot.timestamped.buyers}/${snapshot.timestamped.sellers} in last ${snapshot.timestamped.timeframe.substring(0, 2)}
- Top 10 Holders %: ${snapshot.tokenInfo.top10Holders}
- Insider Holdings %: ${snapshot.tokenInfo.insiderHoldings}
- Developer Holdings %: ${snapshot.tokenInfo.developerHolding}
- Sniper Holdings %: ${snapshot.tokenInfo.sniperHolding}
- Bundlers %: ${snapshot.tokenInfo.bundlers}
- LP Burned %: ${snapshot.tokenInfo.lpBurned}
- Holders: ${snapshot.tokenInfo.holders}
- Pro Traders: ${snapshot.tokenInfo.proTraders}
- Dexscreener Paid: ${snapshot.tokenInfo.dexPaid}`;

		// Add chart image if available
		if (snapshot.chartImage) {
			context += `\n\nCHART VISUAL ANALYSIS:
[This is a chart image in base64 format. Please analyze the price action, volume patterns, support/resistance levels, and any notable chart patterns visible.]
${snapshot.chartImage}`;
		}
	}

	// Instructions for the LLM to generate JSON
	const instructions = `
INSTRUCTIONS:
Based *only* on the provided Trading Opportunity Analysis Context, generate a JSON object containing practical advice for trading this SOLANA memecoin.
The JSON object MUST strictly follow this structure:
{
  "actionStrategy": { "header": string, "body": { "entry": string, "tp_sl": string, "timeframe": string }, "metrics": string[] },
  "liquidityPump": { "header": string, "body": { "mcap": string, "liquidity": string, "net_volume": string, "buyer_seller_ratio": string, "interpretation": string }, "metrics": string[] },
  "holderStructure": { "header": string, "body": { "holders": string, "pro_traders": string, "top_10_pct": string, "interpretation": string }, "metrics": string[] },
  "manipulationRisk": { "header": string, "body": { "insider_pct": string, "dev_pct": string, "snipers_pct": string, "lp_burned_pct": string, "bundlers_pct": string, "interpretation": string }, "metrics": string[] },
  "finalCall": { "header": string, "body": { "based_on": string[] }, "metrics": string[] }
}

- Headers should follow the examples: "✅ Strategy: ...", "✨ Liquidity Health: ...", "👥 Holder Risk: ...", "🐳 Manipulation Risk: ...", "🚨 Final Call: ..."
- Populate the body fields using the provided context. Be concise and specific (e.g., give percentages for TP/SL). Assume a standard memecoin goal of >60% profit if buying.
- The 'metrics' arrays should list the key data points from the context that informed each card's analysis.
- Respond ONLY with the JSON object. Do not include any other text, greetings, or explanations before or after the JSON. Ensure the JSON is valid.
`;

	// Combine context and instructions into the final prompt
	const prompt = context + instructions;
	// console.log('Legacy prompt:', prompt);
	return prompt;
}
