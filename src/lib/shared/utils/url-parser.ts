/**
 * Utilities for parsing and extracting information from URLs
 */

/**
 * Extracts the pool address from an Axiom meme page URL
 * Returns null if not on an Axiom meme page or error occurs
 */
export async function getCurrentAxiomPoolAddress(): Promise<string | null> {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tabs || tabs.length === 0) {
			console.log('No active tab found');
			return null;
		}

		const currentUrl = tabs[0].url || '';
		// Regex to match axiom.trade/meme/POOL_ADDRESS format
		// Adjust character length range as needed for valid pool addresses
		const axiomMemeRegex = /^https?:\/\/(?:www\.)?axiom\.trade\/meme\/([a-zA-Z0-9]{32,44})/i;
		const match = currentUrl.match(axiomMemeRegex);

		if (match && match[1]) {
			return match[1];
		}

		return null;
	} catch (error) {
		console.error('Error getting pool address from URL:', error);
		return null;
	}
}
