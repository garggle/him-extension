/**
 * Data source for scraping token information from Axiom Trade website
 */

// Configuration for all the XPaths we want to extract
const XPATH_CONFIG = {
	top10Holders:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[1]/div[1]/span',
	developerHolding:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[2]/div[1]/span',
	sniperHolding:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[3]/div[1]/span',
	insiderHoldings:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[2]/div[1]/div[1]/span',
	bundlers:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[2]/div[2]/div[1]/span',
	lpBurned:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[2]/div[3]/div[1]/span',
	holders:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[1]/div[1]/span',
	proTraders:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[1]/div[1]/span',
	dexPaid:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[1]/div[1]/span',
	currentTimeScaleVolume:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[1]/span[2]',
	currentTimeScaleBuyers:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[2]/div/span[1]',
	currentTimeScaleSellers:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[3]/div/span[1]',
	price:
		'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[3]/div/span',
	liquidity:
		'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[4]/div/span',
	mcap: '/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[2]/div/span',
	supply:
		'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[5]/div/div/span',
	bought:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[1]/div/span',
	sold: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
	holding:
		'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
	pnl: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[7]/div/span'
};

/**
 * Represents the data structure returned from scraping Axiom token data
 */
export interface AxiomTokenData {
	top10Holders: string | null;
	developerHolding: string | null;
	sniperHolding: string | null;
	insiderHoldings: string | null;
	bundlers: string | null;
	lpBurned: string | null;
	holders: string | null;
	proTraders: string | null;
	dexPaid: string | null;
	currentTimeScaleVolume: string | null;
	currentTimeScaleBuyers: string | null;
	currentTimeScaleSellers: string | null;
	price: string | null;
	liquidity: string | null;
	mcap: string | null;
	supply: string | null;
	bought: string | null;
	sold: string | null;
	holding: string | null;
	pnl: string | null;
}

/**
 * Checks if the current URL matches the axiom.trade/meme/ pattern
 * @returns True if the URL matches, otherwise false
 */
async function isOnAxiomMemePage(): Promise<boolean> {
	try {
		// Get the active tab's URL using Chrome's extension API
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tabs || tabs.length === 0) {
			console.log('Debug URL Check: No active tab found');
			return false;
		}

		const currentUrl = tabs[0].url || '';
		const axiomMemeRegex = /^https?:\/\/(www\.)?axiom\.trade\/meme\/.+/i;
		const result = axiomMemeRegex.test(currentUrl);
		console.log('Debug URL Check:', { currentUrl, matches: result });
		return result;
	} catch (error) {
		console.error('Error checking URL:', error);
		return false;
	}
}

/**
 * Gets the active tab ID
 * @returns The active tab ID or null if not found
 */
async function getActiveTabId(): Promise<number | null> {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tabs || tabs.length === 0) {
			return null;
		}
		return tabs[0].id || null;
	} catch (error) {
		console.error('Error getting active tab:', error);
		return null;
	}
}

/**
 * Injects and executes a content script in the active tab to scrape the data
 * @returns The scraped data or null if there was an error
 */
async function scrapeDataFromActiveTab(): Promise<AxiomTokenData | null> {
	try {
		const tabId = await getActiveTabId();
		if (!tabId) {
			console.error('No active tab found');
			return null;
		}

		// Inject and execute the content script
		const results = await chrome.scripting.executeScript({
			target: { tabId },
			func: () => {
				// This function will be stringified and executed in the context of the web page
				type XPathData = Record<string, string>;

				const XPATH_CONFIG: XPathData = {
					top10Holders:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[1]/div[1]/span',
					developerHolding:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[2]/div[1]/span',
					sniperHolding:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[3]/div[1]/span',
					insiderHoldings:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[2]/div[1]/div[1]/span',
					bundlers:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[2]/div[2]/div[1]/span',
					lpBurned:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[2]/div[3]/div[1]/span',
					holders:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[1]/div[1]/span',
					proTraders:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[1]/div[1]/span',
					dexPaid:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[1]/div[1]/span',
					currentTimeScaleVolume:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[1]/span[2]',
					currentTimeScaleBuyers:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[2]/div/span[1]',
					currentTimeScaleSellers:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[3]/div/span[1]',
					price:
						'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[3]/div/span',
					liquidity:
						'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[4]/div/span',
					mcap: '/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[2]/div/span',
					supply:
						'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[5]/div/div/span',
					bought:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[1]/div/span',
					sold: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
					holding:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
					pnl: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[7]/div/span'
				};

				function extractTextFromXPath(xpath: string): string | null {
					try {
						const element = document.evaluate(
							xpath,
							document,
							null,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null
						).singleNodeValue;

						return element ? (element.textContent || '').trim() : null;
					} catch (error) {
						console.error(`Error extracting text from XPath: ${xpath}`, error);
						return null;
					}
				}

				// Initialize result object
				const scrapedData: Record<string, string | null> = {};

				// Extract data for each field defined in the XPATH_CONFIG
				for (const [dataKey, xpath] of Object.entries(XPATH_CONFIG)) {
					scrapedData[dataKey] = extractTextFromXPath(xpath);
				}

				return scrapedData;
			}
		});

		// If the script executed successfully, return the result
		if (results && results.length > 0 && results[0].result) {
			// Cast to unknown first, then to AxiomTokenData to satisfy TypeScript
			return results[0].result as unknown as AxiomTokenData;
		}

		return null;
	} catch (error) {
		console.error('Error executing content script:', error);
		return null;
	}
}

/**
 * Scrapes token data from the Axiom.trade meme token page
 * Only executes if the current URL matches axiom.trade/meme/{anything}
 * @returns Object containing the scraped data or null if not on an Axiom meme page
 */
export async function scrapeAxiomTokenData(): Promise<AxiomTokenData | null> {
	// Check if we're on an Axiom meme token page
	const isOnAxiomPage = await isOnAxiomMemePage();
	if (!isOnAxiomPage) {
		return null;
	}

	// Scrape data from the active tab
	return await scrapeDataFromActiveTab();
}
