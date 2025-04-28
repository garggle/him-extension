/**
 * Types for GeckoTerminal Trade data
 */

/**
 * Raw response from GeckoTerminal Trades API
 */
export interface GeckoTradeResponse {
	data: GeckoTrade[];
}

export interface GeckoTrade {
	id: string;
	type: 'trade';
	attributes: {
		block_timestamp: number; // Unix timestamp (seconds)
		kind: 'buy' | 'sell';
		price_to_in_currency_token: string; // Price
		to_token_amount: string; // Amount traded (of the token we care about)
		tx_hash: string;
		// Potentially other fields that we're not using right now
	};
}

/**
 * Processed Trade data with numeric values for ease of use
 */
export interface TradeData {
	timestamp: number;
	type: 'buy' | 'sell';
	price: number;
	amount: number;
	txHash: string;
}

/**
 * Factory method to create TradeData from raw API response
 */
export function createTradeData(trade: GeckoTrade): TradeData {
	return {
		timestamp: trade.attributes.block_timestamp,
		type: trade.attributes.kind,
		price: parseFloat(trade.attributes.price_to_in_currency_token),
		amount: parseFloat(trade.attributes.to_token_amount),
		txHash: trade.attributes.tx_hash
	};
}
