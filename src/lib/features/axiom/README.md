# Axiom Token Data Scraper

This feature provides functionality to scrape token data from Axiom Trade meme token pages.

## Overview

The feature is designed to extract key metrics and data points from an Axiom Trade meme token page using XPath selectors. This data can then be displayed in the extension interface.

The scraper only operates when the current browser page URL matches the pattern `axiom.trade/meme/{tokenId}`.

## Data Points Extracted

The feature extracts the following data points:

- Price, Market Cap, Liquidity, Supply
- Top 10 Holders percentage
- Developer, Sniper, and Insider Holdings
- Bundlers and LP Burned information
- Number of Holders and Pro Traders
- Volume, Buyers, and Sellers
- User's Bought, Sold, Holding amounts, and PnL

## Usage

You can use this feature in two ways:

### 1. Using the Service Directly

```typescript
import { axiomService } from '$lib/features/axiom';

// Check if we're on an Axiom page and fetch data
const tokenData = axiomService.getTokenData();

if (tokenData) {
  // // console.log('Price:', tokenData.price);
  // // console.log('Market Cap:', tokenData.mcap);
  // ... use other properties as needed
}
```

### 2. Using the UI Component

```svelte
<script>
  import { AxiomDataFetcher } from '$lib/features/axiom';
</script>

<!-- This component will automatically attempt to fetch and display data -->
<AxiomDataFetcher />
```

## Demo

A demo page is available at `/axiom-demo` which shows how the data fetcher works. Note that for the demo to function correctly, you need to be on an actual Axiom meme token page.

## Technical Implementation

The feature follows a clean architecture approach:

- **Data Sources**: Contains the core scraping functionality with XPath selectors
- **Repositories**: Provides access to the scraped data
- **Application Services**: Exposes business logic for consuming the data
- **UI Components**: Displays the data in a user-friendly format

## Testing

Tests are included to verify the scraper's functionality, using Vitest for unit testing. 