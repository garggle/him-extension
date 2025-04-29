/**
 * Trading feature exports
 */

// Export the original trading analysis functionality
export {
	analyzeTradingData,
	convertAxiomDataToSnapshot,
	convertOhlcvToCandles,
	convertTradeData
} from './application/trading-analysis.js';

// Export the enhanced trading functionality
export {
	analyzeEnhancedTradingData,
	explainModelDecision
} from './application/enhanced-trading-analysis.js';

// Export flow analysis utilities
export {
	analyzeMultiPeriodFlow,
	analyzeTradingFlow,
	detectUnusualPatterns
} from './application/flow-analysis.js';

// Export the enhanced trading service
export {
	enhancedTradingService,
	type EnhancedAnalysisResult
} from './application/enhanced-trading-service.js';

// Export types for the enhanced model
export {
	type EnhancedModelResult,
	type EnhancedTradingFactors,
	type MarketSnapshot,
	type NormalizedFactors
} from './entities/trading-types.js';

// Export model configuration
export {
	DEFAULT_PERIODS,
	DEFAULT_THRESHOLDS,
	DEFAULT_WEIGHTS,
	SCALING_FACTORS,
	type IndicatorPeriods,
	type ModelThresholds,
	type ModelWeights
} from './config/model-config.js';
