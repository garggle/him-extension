/**
 * Utilities for parsing financial metrics from string representations
 */

/**
 * Parses a money string like "$66.6M" or "$1.9K" into a numeric value
 * @param moneyString String representation with currency symbol and optional suffix
 * @returns Numeric value in base units (e.g., "$1M" → 1000000)
 */
export function parseMoneyString(moneyString: string): number {
	console.log('parseMoneyString - Input:', moneyString);

	if (!moneyString) return 0;

	// Remove currency symbol and commas
	const cleaned = moneyString.replace(/[$,]/g, '');
	// console.log('parseMoneyString - After cleaning symbols:', cleaned);

	// Extract the numeric part and the suffix
	const match = cleaned.match(/^([0-9.]+)([KMBT])?$/i);
	// console.log('parseMoneyString - Regex match:', match);

	if (!match) return 0;

	const [, numericPart, suffix] = match;
	let value = parseFloat(numericPart);
	// console.log('parseMoneyString - Parsed numeric value:', value);

	// Apply multiplier based on suffix
	if (suffix) {
		const multipliers: Record<string, number> = {
			K: 1_000,
			M: 1_000_000,
			B: 1_000_000_000,
			T: 1_000_000_000_000
		};

		value *= multipliers[suffix.toUpperCase()] || 1;
		// console.log('parseMoneyString - After applying multiplier:', {
		// 	suffix,
		// 	multiplier: multipliers[suffix.toUpperCase()],
		// 	finalValue: value
		// });
	}

	return value;
}

/**
 * Parses a percentage string (e.g., "13.6%") into a decimal value (0.136)
 * @param percentString String representation with percent symbol
 * @returns Decimal value between 0 and 1
 */
export function parsePercentString(percentString: string): number {
	if (!percentString) return 0;

	// Remove percent symbol and convert to number
	const value = parseFloat(percentString.replace('%', ''));

	// Convert to decimal (0-1 range)
	return isNaN(value) ? 0 : value / 100;
}
