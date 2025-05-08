/**
 * Example script showing how to use the Trading Model with Axiom data
 */

import type { Candle, Snapshot, Trade } from '../../../shared/entities/trading-model.js';
import { TradingService } from '../application/trading-service.js';

// Sample data paths - in a real application, this would come from API calls or stores
const AXIOM_DATA_PATH = '../../../shared/utils/axiom.json';

/**
 * Analyze trading data and log the result
 */
async function analyzeAxiomData() {
	try {
		// In a real application, you'd fetch this data from an API
		// For this example, we'll import directly
		const axiomModule = await import(AXIOM_DATA_PATH);

		// The file contains multiple JSON objects - parse them accordingly
		const snapshotData = axiomModule.default as Snapshot;

		// The candles are in the second JSON array in the file
		const candlesData = (axiomModule as any)[1] as Candle[];

		// The trades are in the third JSON array in the file
		const tradesData = (axiomModule as any)[2] as Trade[];

		// Create a trading service instance
		const tradingService = new TradingService();

		// Run the analysis
		const result = tradingService.analyzeMarketData(snapshotData, candlesData, tradesData);

		// Log the results
		// console.log('===== TRADING MODEL ANALYSIS =====');
		// console.log(`DECISION: ${result.decision}`);
		// console.log(`SCORE: ${result.score.toFixed(4)}`);
		// console.log('\nFACTORS:');
		// console.log(`- Momentum: ${result.factors.momentum.toFixed(4)}`);
		// console.log(`- Volume Trend: ${result.factors.volumeTrend.toFixed(4)}`);
		// console.log(`- Flow Ratio: ${result.factors.flowRatio.toFixed(4)}`);
		// console.log(`- Liquidity Score: ${result.factors.liquidityScore.toFixed(4)}`);
		// console.log(`- Whale Risk: ${result.factors.whaleRisk.toFixed(4)}`);

		return result;
	} catch (error) {
		console.error('Error analyzing Axiom data:', error);
		throw error;
	}
}

// For direct execution in a Node.js environment (not applicable in browser)
// This is just for demonstration purposes
if (typeof process !== 'undefined' && process.argv.includes('--run-analysis')) {
	analyzeAxiomData()
		.then((result) => {
			// console.log('\nAnalysis complete.');
		})
		.catch((error) => {
			console.error('Analysis failed:', error);
			process.exit(1);
		});
}

export { analyzeAxiomData };
