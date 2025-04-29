/**
 * Trade advice module for the background script
 * Exports the getTradeAdvice function for direct use
 */

import { getEnhancedTradeAdvice } from './features/chat/data/trading-analyzer.js';

// Export the function
export { getEnhancedTradeAdvice };

// Export the old function name as an alias for backward compatibility
export { getEnhancedTradeAdvice as getTradeAdvice };
