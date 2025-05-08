// Set up the side panel on extension installation
chrome.runtime.onInstalled.addListener(() => {
	// Set the panel behavior to open on action click
	chrome.sidePanel.setPanelBehavior({
		openPanelOnActionClick: true
	});

	// Register the content script
	chrome.scripting
		.registerContentScripts([
			{
				id: 'axiom-analyzer',
				matches: ['*://axiom.trade/meme/*'],
				js: ['content-scripts/axiom-analyzer.js'],
				runAt: 'document_idle'
			}
		])
		.catch((err) => console.error('Error registering content script:', err));
});

// Open the side panel when the user clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
	chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// console.log('Background script received message:', message);

	if (message.type === 'GET_AXIOM_DATA') {
		// Execute a script in the sender's tab to scrape Axiom data
		chrome.scripting
			.executeScript({
				target: { tabId: sender.tab.id },
				func: scrapeAxiomData
			})
			.then((results) => {
				if (results && results.length > 0) {
					sendResponse({ success: true, data: results[0].result });
				} else {
					sendResponse({ success: false, error: 'No data returned from scraping' });
				}
			})
			.catch((error) => {
				console.error('Error executing scraping script:', error);
				sendResponse({ success: false, error: String(error) });
			});
		return true; // Indicate async response
	}

	if (message.type === 'GET_GECKO_DATA' && message.poolAddress) {
		fetchGeckoTerminalData(message.poolAddress, message.network)
			.then((data) => sendResponse({ success: true, data }))
			.catch((error) => {
				console.error('Error fetching Gecko data:', error);
				sendResponse({ success: false, error: String(error) });
			});
		return true; // Indicate async response
	}

	if (message.type === 'GET_TRADE_ADVICE') {
		if (!message.analysisResult) {
			sendResponse({ success: false, error: 'Missing analysis result data' });
			return false;
		}

		// Forward the message to the extension page via Chrome storage
		// This avoids using import() in the Service Worker context
		chrome.storage.session.set(
			{
				pendingAnalysis: {
					analysisResult: message.analysisResult,
					snapshot: message.snapshot,
					timestamp: Date.now()
				}
			},
			() => {
				// Notify any open extension pages to process this request
				chrome.runtime
					.sendMessage({
						type: 'PROCESS_TRADE_ADVICE',
						origin: sender.tab?.id
					})
					.then(() => {
						// If extension page is open and processed the request, it will respond
						// console.log('Trade advice request processed by extension page');
					})
					.catch((error) => {
						// If no listener is active (extension not open), open the extension
						// console.log('No active listeners, opening extension page to process request');
						if (sender.tab && sender.tab.windowId) {
							// Open the side panel to process the request
							chrome.sidePanel.open({ windowId: sender.tab.windowId });
						}
					});

				// Respond immediately with a pending status
				sendResponse({
					success: true,
					status: 'pending',
					message: 'Trade advice request queued for processing'
				});
			}
		);

		return true; // Indicate async response
	}

	if (message.type === 'TRADE_ADVICE_READY') {
		// When advice is ready, notify the content script that requested it
		if (message.tabId && message.advice) {
			chrome.tabs
				.sendMessage(message.tabId, {
					type: 'TRADE_ADVICE_RESULT',
					advice: message.advice
				})
				.catch((error) => {
					console.error('Error sending trade advice to content script:', error);
				});
		}
		sendResponse({ success: true });
		return false;
	}

	if (message.type === 'OPEN_CHAT_WITH_ADVICE') {
		// Store the advice in session storage for the panel to retrieve
		chrome.storage.session.set(
			{
				tradeAdvice: {
					message: message.advice,
					tokenName: message.tokenName,
					tokenData: message.tokenData,
					timestamp: Date.now()
				}
			},
			() => {
				// console.log('Trade advice stored in session storage');

				// Try to notify the panel if it's already open
				try {
					chrome.runtime
						.sendMessage({
							type: 'NEW_TRADE_ADVICE',
							advice: message.advice,
							tokenName: message.tokenName,
							tokenData: message.tokenData
						})
						.catch(() => {
							// If the message fails (panel not open), open the panel
							// Open the side panel if it's not already open
							if (sender.tab && sender.tab.windowId) {
								chrome.sidePanel.open({ windowId: sender.tab.windowId });
							}
						});
				} catch (error) {
					// console.log('Panel not open yet, opening side panel');
					// Open the side panel if it's not already open
					if (sender.tab && sender.tab.windowId) {
						chrome.sidePanel.open({ windowId: sender.tab.windowId });
					}
				}
			}
		);

		sendResponse({ success: true });
		return false; // No async response needed
	}

	return false; // No async response expected
});

// Function to scrape Axiom data from the page - executed in content context
function scrapeAxiomData() {
	// XPath config for data extraction - default configuration
	const DEFAULT_XPATH_CONFIG = {
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
		timeframe:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[1]/span[1]',
		contractAge:
			'/html[1]/body[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[2]/span[1]',
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
		balance: '/html/body/div[1]/div[1]/div/div[3]/div[2]/div[2]/div/div/button/div[1]/span',
	};

	// XPath config for data extraction when uxento banner is present
	const UXENTO_XPATH_CONFIG = {
		// Add your uxento-specific XPaths here
		// Example format:
		top10Holders:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[1]/div[1]/div[1]/span',
		developerHolding:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[1]/div[2]/div[1]/span',
		sniperHolding:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[1]/div[3]/div[1]/span',
		insiderHoldings:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[2]/div[1]/div[1]/span',
		bundlers:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[2]/div[2]/div[1]/span',
		lpBurned:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[2]/div[3]/div[1]/span',
		holders:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[4]/div[1]/div[1]/span',
		proTraders:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[4]/div[2]/div[1]/span',
		dexPaid:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[4]/div[2]/div[4]/div[3]/div[1]/span',
		currentTimeScaleVolume:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[1]/span[2]',
		currentTimeScaleBuyers:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[2]/div/span[1]',
		currentTimeScaleSellers:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[3]/div/span[1]',
		timeframe:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[1]/span[1]/text()[1]',
		contractAge:
			'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[1]/div[2]/div[2]/span[1]',
		price:
			'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[3]/div/span',
		liquidity:
			'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[4]/div/span',
		mcap: '/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[4]/div/span',
		totalSupply:
			'/html/body/div[1]/div[3]/div/div/div/div/div[1]/div[1]/div/div[1]/div[2]/div/div[5]/div/div/span',
		bought:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div/div[1]/div[6]/div/div[1]/div/span',
		sold: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
		holding:
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div/div[1]/div[5]/div/div[3]/div/span',
		pnl: '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div/div[1]/div[5]/div/div[7]/div/span',
		balance: '/html/body/div[1]/div[1]/div/div[3]/div[2]/div[2]/div/div/button/div[1]/span',
	};

	// Helper function to extract text via XPath
	function extractTextFromXPath(xpath) {
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

	/**
	 * Formats the price string according to the rule:
	 * The first digit between 1-9 represents the number of zeros after decimal point
	 * @param price The raw price string
	 * @returns The formatted price string
	 */
	function formatPrice(price) {
		if (!price) return price;

		try {
			// Extract currency symbol if present
			const currencySymbol = price.match(/[$€£¥]/)?.[0] || '';

			// Clean the price string, keeping only digits and dots
			const numericPart = price.replace(/[^0-9.]/g, '');
			if (!numericPart) return price;

			// Find the first digit between 1-9
			const match = numericPart.match(/[1-9]/);
			if (!match) return price; // Return original if no digit found

			// Get the digit for number of zeros
			const zeroCount = parseInt(match[0]);

			// Remove the first occurrence of this digit from the numeric part
			// We need to escape it since it might be a special regex character
			const escapedDigit = match[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const otherDigits = numericPart.replace(new RegExp(escapedDigit), '');

			// Remove any existing decimal points
			const cleanDigits = otherDigits.replace(/\./g, '');

			// Format with the correct number of zeros after decimal point
			const formattedPrice = `0.${'0'.repeat(zeroCount - 2)}${cleanDigits}`;

			// Add back currency symbol
			return `${currencySymbol}${formattedPrice}`;
		} catch (error) {
			console.error('Error formatting price:', error);
			return price; // Return original price on error
		}
	}

	// Determine which XPath config to use based on presence of uxento banner
	const hasUxentoBanner = document.querySelector('.uxento-dex-banner') !== null;
	const XPATH_CONFIG = hasUxentoBanner ? UXENTO_XPATH_CONFIG : DEFAULT_XPATH_CONFIG;

	// 1. Scrape all data into a flat structure first
	const flatData = {};
	for (const [dataKey, xpath] of Object.entries(XPATH_CONFIG)) {
		flatData[dataKey] = extractTextFromXPath(xpath);
	}

	// 2. Structure the flat data into the nested format
	return {
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
			dexPaid: flatData.dexPaid,
			contractAge: flatData.contractAge
		},
		overall: {
			mcap: flatData.mcap,
			price: formatPrice(flatData.price),
			liquidity: flatData.liquidity,
			totalSupply: flatData.totalSupply
		},
		timestamped: {
			volume: flatData.currentTimeScaleVolume,
			netVolume: flatData.currentTimeScaleVolume,
			buyers: flatData.currentTimeScaleBuyers,
			sellers: flatData.currentTimeScaleSellers,
			timeframe: flatData.timeframe
		}
	};
}

// Function to fetch data from GeckoTerminal API
async function fetchGeckoTerminalData(poolAddress, network = 'solana') {
	const GECKO_API_BASE_URL = 'https://api.geckoterminal.com/api/v2';

	try {
		// Define API endpoints
		const ohlcvUrl = `${GECKO_API_BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/minute?limit=1000`;
		const tradesUrl = `${GECKO_API_BASE_URL}/networks/${network}/pools/${poolAddress}/trades`;

		// console.log('Fetching GeckoTerminal data:', { ohlcvUrl, tradesUrl });

		// Fetch both endpoints concurrently
		const [ohlcvResponse, tradesResponse] = await Promise.all([fetch(ohlcvUrl), fetch(tradesUrl)]);

		// Process OHLCV data
		let ohlcvData = [];
		if (ohlcvResponse.ok) {
			const ohlcvJson = await ohlcvResponse.json();
			if (ohlcvJson?.data?.attributes?.ohlcv_list) {
				ohlcvData = ohlcvJson.data.attributes.ohlcv_list.map((item) => ({
					timestamp: item[0],
					open: parseFloat(item[1]),
					high: parseFloat(item[2]),
					low: parseFloat(item[3]),
					close: parseFloat(item[4]),
					volume: parseFloat(item[5])
				}));
			}
		}

		// Process Trades data
		let tradesData = [];
		if (tradesResponse.ok) {
			const tradesJson = await tradesResponse.json();
			if (tradesJson?.data && Array.isArray(tradesJson.data)) {
				tradesData = tradesJson.data.map((trade) => ({
					timestamp: trade.attributes.block_timestamp,
					type: trade.attributes.kind,
					price: parseFloat(trade.attributes.price_to_in_currency_token),
					amount: parseFloat(trade.attributes.to_token_amount),
					txHash: trade.attributes.tx_hash
				}));
			}
		}

		return {
			ohlcv: ohlcvData,
			trades: tradesData
		};
	} catch (error) {
		console.error('Error fetching GeckoTerminal data:', error);
		throw error;
	}
}
