/**
 * TradingService - Application layer service to manage trading model analysis
 */

import { writable, type Readable, type Writable } from 'svelte/store';
import {
	analyzeTradingOpportunity,
	DEFAULT_THRESHOLDS,
	DEFAULT_WEIGHTS,
	type Candle,
	type ModelResult,
	type Snapshot,
	type Trade
} from '../../../shared/entities/trading-model.js';

export class TradingService {
	private _modelResult: Writable<ModelResult | null> = writable(null);

	/**
	 * Public read-only model result store
	 */
	public readonly modelResult: Readable<ModelResult | null> = {
		subscribe: (callback) => this._modelResult.subscribe(callback)
	};

	/**
	 * Run the trading analysis model with current data
	 */
	public analyzeMarketData(snapshot: Snapshot, candles: Candle[], trades: Trade[]): ModelResult {
		// Run the analysis
		const result = analyzeTradingOpportunity(
			snapshot,
			candles,
			trades,
			DEFAULT_WEIGHTS,
			DEFAULT_THRESHOLDS
		);

		// Store the result
		this._modelResult.set(result);

		return result;
	}

	/**
	 * Clear the current model result
	 */
	public clearResult(): void {
		this._modelResult.set(null);
	}
}
