# Trading Model for Memecoins

This module provides a sophisticated trading model for analyzing memecoin market conditions and generating actionable trading signals (BUY, SELL, HOLD).

## Overview

The trading model evaluates multiple factors:

1. **Technical Analysis**
   - Momentum (price vs 30-period SMA)
   - Volume trend (recent 5 periods vs previous 5)
   
2. **Order Flow Analysis**
   - Buy/Sell ratio from recent trades
   
3. **Fundamentals**
   - Liquidity-to-Market Cap ratio
   - Whale/Insider concentration risk

## How to Use

```typescript
import { TradingService } from '$lib/features/trading/application/trading-service.js';
import type { Snapshot, Candle, Trade } from '$lib/shared/entities/trading-model.js';

// Create a service instance
const tradingService = new TradingService();

// Example of analyzing data
function analyzeMarket(snapshot: Snapshot, candles: Candle[], trades: Trade[]) {
  // Run analysis and get result
  const result = tradingService.analyzeMarketData(snapshot, candles, trades);
  
  console.log('Trading decision:', result.decision); // 'BUY', 'SELL', or 'HOLD'
  console.log('Confidence score:', result.score);
  console.log('Factor breakdown:', result.factors);
  
  // Later, you can access the results through the reactive store
  const unsubscribe = tradingService.modelResult.subscribe(currentResult => {
    // Handle updates to the model result
    if (currentResult) {
      // Do something with the result
    }
  });
  
  // Remember to unsubscribe when done
  // unsubscribe();
}
```

## Data Formats

The model requires three data sources:

1. **Snapshot** - Current state of the token (market cap, liquidity, etc.)
2. **Candles** - OHLCV price data (typically minute candles)
3. **Trades** - Recent buy/sell transaction history

See the `trading-model.ts` entity for type definitions.

## Extending the Model

The trading model is designed to be extensible. You can:

1. Adjust weight parameters to favor certain signals
2. Modify threshold values to change sensitivity
3. Add new factors by extending the core algorithm

## Future Enhancements

- Risk management layer
- Parameter optimization based on backtesting
- Multi-timeframe analysis
- Machine learning integration 