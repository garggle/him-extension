/**
 * Enhanced TradingService
 * Application layer service to manage trading model analysis with advanced indicators
 */

import type { AxiomTokenData } from '$lib/features/axiom/entities/token-data.js';
import type { OhlcvData } from '$lib/features/gecko-terminal/entities/gecko-ohlcv.js';
import type { TradeData } from '$lib/features/gecko-terminal/entities/gecko-trade.js';
import { writable, type Readable, type Writable } from 'svelte/store';
import type { EnhancedModelResult } from '../entities/trading-types.js';
import { analyzeEnhancedTradingData, explainModelDecision } from './enhanced-trading-analysis.js';

/**
 * Combined result of enhanced trading analysis
 */
export interface EnhancedAnalysisResult {
	modelResult: EnhancedModelResult;
	manipulationWarnings: string[];
	manipulationScore: number;
	explanation: string;
}

/**
 * Enhanced trading service with improved model and manipulation detection
 */
export class EnhancedTradingService {
	private _analysisResult: Writable<EnhancedAnalysisResult | null> = writable(null);

	/**
	 * Public read-only analysis result store
	 */
	public readonly analysisResult: Readable<EnhancedAnalysisResult | null> = {
		subscribe: (callback) => this._analysisResult.subscribe(callback)
	};

	/**
	 * Run the enhanced trading analysis with current data
	 */
	public analyzeMarketData(
		axiomData: AxiomTokenData,
		ohlcvData?: OhlcvData[],
		tradeData?: TradeData[]
	): EnhancedAnalysisResult {
		// Run the enhanced analysis
		const analysis = analyzeEnhancedTradingData(axiomData, ohlcvData, tradeData);

		// Generate human-readable explanation
		const explanation = explainModelDecision(analysis.modelResult);

		// Complete result
		const result: EnhancedAnalysisResult = {
			...analysis,
			explanation
		};

		// Store the result
		this._analysisResult.set(result);

		return result;
	}

	/**
	 * Get warning level based on manipulation score
	 */
	public getManipulationWarningLevel(manipulationScore: number): 'low' | 'medium' | 'high' {
		if (manipulationScore < 0.3) return 'low';
		if (manipulationScore < 0.6) return 'medium';
		return 'high';
	}

	/**
	 * Adjust confidence based on manipulation score
	 * When manipulation is detected, reduce the confidence in the model's decision
	 */
	public getAdjustedConfidence(score: number, manipulationScore: number): number {
		// Reduce confidence based on manipulation score
		return score * (1 - manipulationScore * 0.5);
	}

	/**
	 * Clear the current analysis result
	 */
	public clearResult(): void {
		this._analysisResult.set(null);
	}
}

// Create a singleton instance of the enhanced service
export const enhancedTradingService = new EnhancedTradingService();
