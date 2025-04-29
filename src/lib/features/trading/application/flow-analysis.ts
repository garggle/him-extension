/**
 * Flow analysis utilities
 * Functions to analyze buy/sell patterns in trading data
 */

import type { Trade } from '$lib/shared/entities/trading-model.js';
import { calculateFlowImbalance } from '$lib/shared/utils/normalization.js';

/**
 * Analysis result for trade flow
 */
export interface FlowAnalysisResult {
	// Time window in minutes
	windowMinutes: number;

	// Metrics
	buyVolume: number;
	sellVolume: number;
	buyCount: number;
	sellCount: number;

	// Derived metrics
	totalVolume: number;
	netFlow: number;
	flowImbalance: number;
	averageBuySize: number;
	averageSellSize: number;

	// Largest transactions
	largestBuy: Trade | null;
	largestSell: Trade | null;
}

/**
 * Analyzes trade flow over a specified time window
 * @param trades List of trades
 * @param windowMinutes Time window in minutes (defaults to 5 minutes)
 * @returns Flow analysis result
 */
export function analyzeTradingFlow(trades: Trade[], windowMinutes: number = 5): FlowAnalysisResult {
	// Filter to recent trades within the time window
	const windowMs = windowMinutes * 60 * 1000;
	const cutoffTime = new Date(Date.now() - windowMs).toISOString();
	const recentTrades = trades.filter((trade) => trade.timestamp >= cutoffTime);

	// Initialize result
	const result: FlowAnalysisResult = {
		windowMinutes,
		buyVolume: 0,
		sellVolume: 0,
		buyCount: 0,
		sellCount: 0,
		totalVolume: 0,
		netFlow: 0,
		flowImbalance: 0,
		averageBuySize: 0,
		averageSellSize: 0,
		largestBuy: null,
		largestSell: null
	};

	// If no trades in the window, return empty result
	if (recentTrades.length === 0) {
		return result;
	}

	// Group trades by type and calculate metrics
	for (const trade of recentTrades) {
		const tradeVolume = trade.amount * trade.price;

		if (trade.type === 'buy') {
			result.buyVolume += tradeVolume;
			result.buyCount++;

			// Track largest buy
			if (!result.largestBuy || tradeVolume > result.largestBuy.amount * result.largestBuy.price) {
				result.largestBuy = trade;
			}
		} else {
			result.sellVolume += tradeVolume;
			result.sellCount++;

			// Track largest sell
			if (
				!result.largestSell ||
				tradeVolume > result.largestSell.amount * result.largestSell.price
			) {
				result.largestSell = trade;
			}
		}
	}

	// Calculate derived metrics
	result.totalVolume = result.buyVolume + result.sellVolume;
	result.netFlow = result.buyVolume - result.sellVolume;
	result.flowImbalance = calculateFlowImbalance(result.buyVolume, result.sellVolume);

	// Calculate averages
	result.averageBuySize = result.buyCount > 0 ? result.buyVolume / result.buyCount : 0;
	result.averageSellSize = result.sellCount > 0 ? result.sellVolume / result.sellCount : 0;

	return result;
}

/**
 * Analyzes trade flow across multiple time periods
 * @param trades List of trades
 * @returns Object with flow analysis for different time windows
 */
export function analyzeMultiPeriodFlow(trades: Trade[]): {
	shortTerm: FlowAnalysisResult;
	mediumTerm: FlowAnalysisResult;
	longTerm: FlowAnalysisResult;
} {
	return {
		shortTerm: analyzeTradingFlow(trades, 5), // 5 minutes
		mediumTerm: analyzeTradingFlow(trades, 30), // 30 minutes
		longTerm: analyzeTradingFlow(trades, 120) // 2 hours
	};
}

/**
 * Detect unusual trading patterns that could indicate manipulation
 * @param flowAnalysis Flow analysis results for various time periods
 * @returns Object with potential warnings and manipulation indicators
 */
export function detectUnusualPatterns(flowAnalysis: {
	shortTerm: FlowAnalysisResult;
	mediumTerm: FlowAnalysisResult;
	longTerm: FlowAnalysisResult;
}): {
	warnings: string[];
	manipulationScore: number;
} {
	const warnings: string[] = [];
	let manipulationScore = 0;

	// Check for sudden change in buy/sell pattern
	const shortTermImbalance = flowAnalysis.shortTerm.flowImbalance;
	const mediumTermImbalance = flowAnalysis.mediumTerm.flowImbalance;
	const longTermImbalance = flowAnalysis.longTerm.flowImbalance;

	// Detect sudden sell pressure after sustained buying
	if (shortTermImbalance < -0.7 && mediumTermImbalance > 0.5) {
		warnings.push('Sudden sell pressure after sustained buying');
		manipulationScore += 0.3;
	}

	// Detect abnormal transaction sizes
	const shortAvgBuy = flowAnalysis.shortTerm.averageBuySize;
	const mediumAvgBuy = flowAnalysis.mediumTerm.averageBuySize;

	if (shortAvgBuy > 5 * mediumAvgBuy && shortAvgBuy > 0) {
		warnings.push('Unusually large buy transactions in recent activity');
		manipulationScore += 0.2;
	}

	// Detect wash trading pattern (balanced buys and sells with high volume)
	if (
		Math.abs(flowAnalysis.shortTerm.flowImbalance) < 0.1 &&
		flowAnalysis.shortTerm.totalVolume > (3 * flowAnalysis.mediumTerm.totalVolume) / 6 // Compare equivalent time periods
	) {
		warnings.push('Possible wash trading (balanced buys/sells with high volume)');
		manipulationScore += 0.4;
	}

	// Detect one-sided market
	if (Math.abs(longTermImbalance) > 0.9) {
		warnings.push(`Extremely ${longTermImbalance > 0 ? 'buy' : 'sell'}-sided market`);
		manipulationScore += 0.2;
	}

	return {
		warnings,
		manipulationScore: Math.min(1, manipulationScore)
	};
}
