/**
 * Data source for scraping token information from Axiom Trade website
 */
import { AxiomTokenData } from '../../entities/token-data.js';

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
 * Raw data structure returned from content script
 */
type RawAxiomData = {
	userTrading: {
		bought: string | null;
		sold: string | null;
		holding: string | null;
		pnl: string | null;
		balance: string | null;
	};
	tokenInfo: {
		top10Holders: string | null;
		developerHolding: string | null;
		sniperHolding: string | null;
		insiderHoldings: string | null;
		bundlers: string | null;
		lpBurned: string | null;
		holders: string | null;
		proTraders: string | null;
		dexPaid: string | null;
	};
	overall: {
		mcap: string | null;
		price: string | null;
		liquidity: string | null;
		totalSupply: string | null;
	};
	timestamped: {
		volume: string | null;
		buyers: string | null;
		sellers: string | null;
	};
};

/**
 * Injects and executes a content script in the active tab to scrape the data
 * @returns The structured scraped data or null if there was an error
 */
async function scrapeDataFromActiveTab(): Promise<AxiomTokenData | null> {
	try {
		const tabId = await getActiveTabId();
		if (!tabId) {
			console.error('No active tab found');
			return null;
		}

		// Inject and execute the content script
		const results = await chrome.scripting.executeScript<[], RawAxiomData>({
			target: { tabId },
			func: () => {
				// ----- Content Script Logic Starts -----
				type XPathConfigType = Record<string, string>;
				type FlatData = Record<string, string | null>;

				// Copy of XPATH_CONFIG (needs to be self-contained in the injected function)
				const XPATH_CONFIG: XPathConfigType = {
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
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[2]/div[1]/span',
					dexPaid:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div[4]/div[3]/div[1]/span',
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
					totalSupply:
						'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[5]/div/div/span',
					bought:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[1]/div/span',
					sold: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
					holding:
						'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
					pnl: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[5]/div/div[7]/div/span',
					balance: '/html/body/div[1]/div[1]/div/div[3]/div[2]/div[2]/div/div/button/div[1]/span'
				};

				// Helper function to extract text via XPath and handle subscript tags
				function extractTextFromXPath(xpath: string): string | null {
					try {
						const element = document.evaluate(
							xpath,
							document,
							null,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null
						).singleNodeValue as HTMLElement | null;

						if (!element) return null;

						// Handle cases where we need to process HTML (like subscript tags)
						if (element.innerHTML && element.innerHTML.includes('<sub>')) {
							// Create a temporary div to work with the HTML
							const tempDiv = document.createElement('div');
							tempDiv.innerHTML = element.innerHTML;

							// Debug: log the element with subscript before processing
							console.log('Processing element with subscript:', {
								rawHTML: element.innerHTML,
								xpath: xpath,
								key:
									Object.entries(XPATH_CONFIG).find(([_, path]) => path === xpath)?.[0] || 'unknown'
							});

							// Process the HTML to handle subscript tags properly
							// This ensures digits in <sub> tags are correctly merged into the numeric value
							let result = '';
							for (const node of tempDiv.childNodes) {
								if (node.nodeType === Node.TEXT_NODE) {
									result += node.textContent || '';
								} else if (node.nodeName === 'SUB') {
									// For subscript, we add the content directly inline
									result += node.textContent || '';
								} else {
									// For other elements, just add their text content
									result += node.textContent || '';
								}
							}

							// Debug: log the processed result
							console.log('Processed result:', {
								result: result.trim(),
								originalHTML: element.innerHTML
							});

							return result.trim();
						}

						// If no subscript processing needed, just return the text content
						return element.textContent ? element.textContent.trim() : null;
					} catch (error) {
						console.error(`Error extracting text from XPath: ${xpath}`, error);
						return null;
					}
				}

				// 1. Scrape all data into a flat structure first
				const flatData: FlatData = {};
				for (const [dataKey, xpath] of Object.entries(XPATH_CONFIG)) {
					flatData[dataKey] = extractTextFromXPath(xpath);
				}

				// 2. Structure the flat data into the nested format
				const structuredData = {
					userTrading: {
						bought: flatData.bought,
						sold: flatData.sold,
						holding: flatData.holding,
						pnl: flatData.pnl,
						balance: flatData.balance
					},
					tokenInfo: {
						top10Holders: flatData.top10Holders,
						developerHolding: flatData.developerHolding,
						sniperHolding: flatData.sniperHolding,
						insiderHoldings: flatData.insiderHoldings,
						bundlers: flatData.bundlers,
						lpBurned: flatData.lpBurned,
						holders: flatData.holders,
						proTraders: flatData.proTraders,
						dexPaid: flatData.dexPaid
					},
					overall: {
						mcap: flatData.mcap,
						price: flatData.price,
						liquidity: flatData.liquidity,
						totalSupply: flatData.totalSupply
					},
					timestamped: {
						volume: flatData.currentTimeScaleVolume,
						buyers: flatData.currentTimeScaleBuyers,
						sellers: flatData.currentTimeScaleSellers
					}
				};

				// Debug: Log the complete structured data
				console.log('Axiom Scraper - Complete Data:', structuredData);

				return structuredData;
				// ----- Content Script Logic Ends -----
			}
		});

		// If the script executed successfully, return the result
		if (results && results.length > 0 && results[0].result) {
			// Convert the raw data into our entity classes
			const rawData = results[0].result;
			return AxiomTokenData.create(rawData);
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
 * @returns Object containing the structured scraped data or null if not on an Axiom meme page
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
