/**
/**
 * Axiom analyzer content script
 * Injects a "What should I do?" button into Axiom meme token pages
 */

// Global cache for analysis data
window.axiomAnalyzerCache = {};

// Track if we're on a meme token page
let isOnMemePage = false;

// Setup for SPA navigation detection (history API)
let lastUrl = window.location.href;

// Track button presence to avoid duplicate injections
let buttonInjected = false;

// Persistent checker interval
let persistentCheckerInterval = null;

// Main initialization function
function initialize() {
	// Check if we're on a meme token page
	isOnMemePage = window.location.href.match(/^https?:\/\/(www\.)?axiom\.trade\/meme\/.+/i);

	if (isOnMemePage) {
		// console.log('Axiom Analyzer: Detected meme token page');
		// Only inject if not already present
		if (!document.getElementById('him-analyzer-button')) {
			buttonInjected = false;
			// Wait a bit for the page to settle (especially important for SPAs)
			setTimeout(injectAnalyzerButton, 1000);

			// Set up a repeat check (safety net) to ensure button gets injected
			// This helps with complex SPAs where other detection methods might fail
			setupInjectionSafetyNet();
		}
	} else {
		// Reset button state when not on a meme page
		buttonInjected = false;
	}

	// Setup persistent checker if not already running
	setupPersistentChecker();
}

/**
 * Sets up a persistent checker that continuously monitors for meme pages
 * This ensures we catch navigation events even if other methods fail
 */
function setupPersistentChecker() {
	// Clear any existing persistent checker
	if (persistentCheckerInterval) {
		clearInterval(persistentCheckerInterval);
	}

	// Set up a new persistent checker that runs every 2 seconds
	persistentCheckerInterval = setInterval(() => {
		// Check if URL indicates we're on a meme page
		const onMemePage = window.location.href.match(/^https?:\/\/(www\.)?axiom\.trade\/meme\/.+/i);

		// If we're on a meme page but the state doesn't reflect that, reinitialize
		if (onMemePage && (!isOnMemePage || !document.getElementById('him-analyzer-button'))) {
			// console.log('Axiom Analyzer: Persistent checker detected meme page, reinitializing');
			isOnMemePage = true;
			buttonInjected = false;
			setTimeout(injectAnalyzerButton, 500);
		} else if (!onMemePage && isOnMemePage) {
			// Update our state if we've navigated away from a meme page
			// console.log('Axiom Analyzer: Persistent checker detected navigation away from meme page');
			isOnMemePage = false;
			buttonInjected = false;
		}
	}, 2000); // Check every 2 seconds
}

/**
 * Sets up a safety net to ensure button injection
 * Will retry injection a few times if we're on a meme page but no button exists
 */
function setupInjectionSafetyNet() {
	let attemptCount = 0;
	const maxAttempts = 10; // Increased from 5 to 10 attempts

	// Clear any existing safety net interval
	if (window.axiomInjectionInterval) {
		clearInterval(window.axiomInjectionInterval);
	}

	// Setup new interval
	window.axiomInjectionInterval = setInterval(() => {
		// Only try if we're on a meme page and button isn't present
		if (
			window.location.href.match(/^https?:\/\/(www\.)?axiom\.trade\/meme\/.+/i) &&
			!document.getElementById('him-analyzer-button')
		) {
			// console.log(
			// 	`Axiom Analyzer: Safety net injection attempt ${attemptCount + 1}/${maxAttempts}`
			// );
			// Reset the buttonInjected flag before trying again
			buttonInjected = false;
			injectAnalyzerButton();
			attemptCount++;

			// After max attempts, stop trying
			if (attemptCount >= maxAttempts) {
				clearInterval(window.axiomInjectionInterval);
				window.axiomInjectionInterval = null;
				// console.log('Axiom Analyzer: Maximum safety net attempts reached');
			}
		} else {
			// If button exists or we're not on a meme page, clear the interval
			clearInterval(window.axiomInjectionInterval);
			window.axiomInjectionInterval = null;
			// console.log('Axiom Analyzer: Safety net no longer needed');
		}
	}, 2000); // Try every 2 seconds (faster than before)
}

// Setup URL change detection (for SPA navigation)
function setupNavigationMonitoring() {
	// Method 1: Use MutationObserver to detect DOM changes
	// First observer watches for high-level changes
	const bodyObserver = new MutationObserver(
		throttle((mutations) => {
			// Check if URL changed
			if (lastUrl !== window.location.href) {
				lastUrl = window.location.href;
				initialize();
			}
		}, 500)
	); // Throttle to once every 500ms

	// Observe only the body element and its direct children for changes
	bodyObserver.observe(document.body, {
		childList: true,
		subtree: false, // Only watch direct children
		attributes: false,
		characterData: false
	});

	// Second observer watches for content changes in the main content area
	// This helps with SPAs that modify content without changing root DOM structure
	setTimeout(() => {
		// Try to find the main content container
		const mainContentSelectors = [
			'#app-content',
			'#main-content',
			'.main-content',
			'main',
			'[role="main"]',
			'.content-wrapper'
		];

		let contentContainer = null;
		for (const selector of mainContentSelectors) {
			const element = document.querySelector(selector);
			if (element) {
				contentContainer = element;
				break;
			}
		}

		// If we can't find a specific content container, use div[3] (common pattern)
		if (!contentContainer) {
			const divs = document.querySelectorAll('body > div');
			if (divs.length >= 3) {
				contentContainer = divs[2]; // 3rd div (0-indexed)
			}
		}

		// If we found a content container, observe it
		if (contentContainer) {
			// console.log('Axiom Analyzer: Setting up content observer on', contentContainer);
			const contentObserver = new MutationObserver(
				throttle(() => {
					// Check if we're on a meme page but button is missing
					if (isOnMemePage && !document.getElementById('him-analyzer-button') && !buttonInjected) {
						// console.log('Axiom Analyzer: Content changed, attempting button injection');
						setTimeout(injectAnalyzerButton, 500);
					}

					// Also check if URL changed (for safety)
					if (lastUrl !== window.location.href) {
						lastUrl = window.location.href;
						initialize();
					}
				}, 1000)
			); // Less frequent than body observer

			contentObserver.observe(contentContainer, {
				childList: true,
				subtree: true,
				attributes: false,
				characterData: false
			});
		}
	}, 2000); // Wait for page to fully load

	// Method 2: History API monitoring
	const originalPushState = window.history.pushState;
	const originalReplaceState = window.history.replaceState;

	// Override pushState
	window.history.pushState = function () {
		originalPushState.apply(this, arguments);
		setTimeout(initialize, 300); // Small delay to let the page update
	};

	// Override replaceState
	window.history.replaceState = function () {
		originalReplaceState.apply(this, arguments);
		setTimeout(initialize, 300); // Small delay to let the page update
	};

	// Method 3: Handle popstate events
	window.addEventListener('popstate', () => {
		setTimeout(initialize, 300); // Small delay to let the page update
	});
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
function throttle(func, limit) {
	let inThrottle;
	return function () {
		const args = arguments;
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'TRADE_ADVICE_RESULT' && message.advice) {
		// We received the trade advice from the extension page
		// console.log('Received trade advice result:', message.advice);

		// Get the button element
		const button = document.getElementById('him-analyzer-button');
		if (!button) return;

		// Show a success message
		button.textContent = 'Advice received!';

		// Get any cached analysis data
		const cachedData = window.axiomAnalyzerCache || {};

		// Open the chat UI with the advice
		chrome.runtime.sendMessage({
			type: 'OPEN_CHAT_WITH_ADVICE',
			advice: message.advice,
			tokenName: getTokenNameFromPage(),
			tokenData: cachedData.tokenData || {
				price: 'Unknown',
				mcap: 'Unknown',
				liquidity: 'Unknown',
				decision: 'Unknown',
				score: 0
			}
		});

		// Reset the button after a delay
		setTimeout(() => {
			button.textContent = 'What should I do?';
			button.disabled = false;
		}, 2000);
	}

	// Always return false since we don't use sendResponse
	return false;
});

// Run initialization on initial page load
window.addEventListener('load', () => {
	initialize();
	setupNavigationMonitoring();
	setupNetworkMonitoring();
	setupPersistentChecker(); // Ensure persistent checker is set up
});

// Run initialization immediately in case the page is already loaded
initialize();
setupNavigationMonitoring();
setupNetworkMonitoring();
setupPersistentChecker(); // Ensure persistent checker is set up

/**
 * Injects the analysis button into the page
 */
function injectAnalyzerButton() {
	try {
		// Verify we're still on a meme page (URL could have changed)
		const onMemePage = window.location.href.match(/^https?:\/\/(www\.)?axiom\.trade\/meme\/.+/i);
		if (!onMemePage) {
			// console.log('Axiom Analyzer: Not on a meme page anymore, skipping injection.');
			isOnMemePage = false;
			buttonInjected = false;
			return;
		}

		// Update our state
		isOnMemePage = true;

		// Check if button already exists to avoid duplicates
		if (document.getElementById('him-analyzer-button')) {
			// console.log('Axiom Analyzer: Button already exists. Skipping injection.');
			return;
		}

		// Set flag that we're attempting an injection
		buttonInjected = true;

		// Try to find the target element using various methods in order
		let targetElement = null;

		// Method 1: Primary XPath approach
		let targetXPath;
		if (document.querySelector('.uxento-dex-banner')) {
			targetXPath = '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[3]/div[2]/div/div[1]/div[4]';
		} else {
			targetXPath = '/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[4]';
		}
		targetElement = getElementByXPath(targetXPath);

		// Method 2: Look for specific dashboard elements if XPath fails
		if (!targetElement) {
			// console.log('Axiom Analyzer: Primary XPath failed, trying alternative selectors...');

			// Try common selectors that might contain trading actions
			const selectors = [
				'.flex.flex-row button', // Buttons in flex containers
				'.token-details button', // Buttons in token details section
				'.trade-actions', // Trade actions container
				'.dashboard-actions', // Dashboard actions container
				'.order-panel', // Order panel
				'[data-testid="trading-panel"]' // Elements with specific test IDs
			];

			// Try to find a suitable container
			for (const selector of selectors) {
				const elements = document.querySelectorAll(selector);
				if (elements.length > 0) {
					// Get the last button's parent as our target
					targetElement = elements[elements.length - 1].parentElement;
					if (targetElement) {
						// console.log(`Axiom Analyzer: Found target using selector: ${selector}`);
						break;
					}
				}
			}
		}

		// Method 3: Last resort - find any trading-related section
		if (!targetElement) {
			// Look for headings or text nodes that indicate trading sections
			const tradingKeywords = ['trade', 'swap', 'buy', 'sell', 'order', 'liquidity', 'chart'];
			const allElements = document.querySelectorAll('div, section, h1, h2, h3, h4, p, span');

			for (const element of allElements) {
				const text = (element.textContent || '').toLowerCase();
				if (tradingKeywords.some((keyword) => text.includes(keyword))) {
					// Found a container with trading-related text
					targetElement = element.closest('div:not(body)');
					if (targetElement) {
						// console.log('Axiom Analyzer: Found target using keyword search');
						break;
					}
				}
			}
		}

		// Give up if we still can't find a suitable target
		if (!targetElement) {
			console.warn(
				'Axiom Analyzer: Could not find any suitable target element. Button not injected.'
			);
			// Reset flag since injection failed
			buttonInjected = false;
			return;
		}

		// Create the analyzer button
		const analyzerButton = document.createElement('button');
		analyzerButton.textContent = 'What should I do?';
		analyzerButton.id = 'him-analyzer-button';

		// Apply styles similar to InputArea.svelte
		analyzerButton.style.fontFamily = 'Space Mono, monospace';
		analyzerButton.style.backgroundColor = 'rgba(160, 81, 209, 0.247)';
		analyzerButton.style.color = '#EED2FF';
		analyzerButton.style.border = '1px solid rgba(238, 210, 255, 0.6)';
		analyzerButton.style.borderRadius = '0.375rem';
		analyzerButton.style.padding = '0.5rem 1rem';
		analyzerButton.style.marginTop = '0.75rem';
		analyzerButton.style.marginBottom = '0.5rem';
		analyzerButton.style.fontSize = '0.95rem';
		analyzerButton.style.cursor = 'pointer';
		analyzerButton.style.transition = 'all 0.2s ease';
		analyzerButton.style.width = '100%';
		analyzerButton.style.display = 'block';
		analyzerButton.style.letterSpacing = '0.5px';

		// Add hover effects via event listeners
		analyzerButton.addEventListener('mouseover', () => {
			analyzerButton.style.backgroundColor = 'rgba(160, 81, 209, 0.411)';
			analyzerButton.style.boxShadow = '0 0 8px rgba(238, 210, 255, 0.5)';
		});

		analyzerButton.addEventListener('mouseout', () => {
			analyzerButton.style.backgroundColor = 'rgba(160, 81, 209, 0.247)';
			analyzerButton.style.boxShadow = 'none';
		});

		// Add click handler
		analyzerButton.addEventListener('click', handleAnalyzerClick);

		// Create a wrapper div to place our button in
		const buttonWrapper = document.createElement('div');
		buttonWrapper.style.width = '100%';
		buttonWrapper.style.marginTop = '0px';
		buttonWrapper.style.marginBottom = '12px';
		buttonWrapper.style.display = 'flex';
		buttonWrapper.style.justifyContent = 'center';
		buttonWrapper.style.padding = '0 16px';

		// Add the button to our wrapper
		buttonWrapper.appendChild(analyzerButton);

		// Try different insertion methods in sequence
		let inserted = false;

		// Method 1: Try to insert after the flex container
		const flexContainer = targetElement.closest('.flex.flex-row');
		if (flexContainer && flexContainer.parentNode) {
			flexContainer.parentNode.insertBefore(buttonWrapper, flexContainer.nextSibling);
			inserted = true;
			// console.log('Axiom Analyzer: Button inserted after flex container');
		}

		// Method 2: Try to insert after the target's parent
		if (!inserted) {
			const parentContainer = targetElement.parentNode;
			if (parentContainer && parentContainer.parentNode) {
				parentContainer.parentNode.insertBefore(buttonWrapper, parentContainer.nextSibling);
				inserted = true;
				// console.log('Axiom Analyzer: Button inserted after parent container');
			}
		}

		// Method 3: Fallback to appending to target element
		if (!inserted) {
			targetElement.appendChild(buttonWrapper);
			inserted = true;
			// console.log('Axiom Analyzer: Button appended to target element');
		}

		// console.log('Axiom Analyzer: Button successfully injected');
	} catch (error) {
		// Reset flag since injection failed
		buttonInjected = false;
		console.error('Axiom Analyzer: Error injecting button:', error);
	}
}

/**
 * Handles the analyzer button click
 */
async function handleAnalyzerClick() {
	const button = document.getElementById('him-analyzer-button');
	if (!button) return;

	// Update button state to indicate processing
	const originalText = button.textContent;
	button.textContent = 'Analyzing...';
	button.disabled = true;

	try {
		// console.log('Axiom Analyzer: Starting analysis');

		// 1. Get Axiom data from the page
		const axiomData = await getAxiomData();
		if (!axiomData) {
			throw new Error('Failed to get token data');
		}

		// console.log('Axiom Analyzer: Token data retrieved:', axiomData);

		// 2. Try to get GeckoTerminal data if possible
		const poolAddress = getPoolAddressFromUrl();
		let geckoData = null;

		if (poolAddress) {
			try {
				geckoData = await getGeckoData(poolAddress);
				// console.log('Axiom Analyzer: GeckoTerminal data retrieved:', geckoData);
			} catch (error) {
				console.warn('Axiom Analyzer: Failed to get GeckoTerminal data:', error);
				// Continue without Gecko data
			}
		}

		// 3. Analyze the data
		const analysisResult = await analyzeData(axiomData, geckoData);

		// 4. Create the snapshot from axiom data
		const snapshot = {
			userTrading: {
				bought: axiomData.userTrading.bought || '0',
				sold: axiomData.userTrading.sold || '0',
				holding: axiomData.userTrading.holding || '0',
				pnl: axiomData.userTrading.pnl || '0%',
				balance: axiomData.userTrading.balance || '0'
			},
			tokenInfo: {
				top10Holders: axiomData.tokenInfo.top10Holders || '0%',
				developerHolding: axiomData.tokenInfo.developerHolding || '0%',
				sniperHolding: axiomData.tokenInfo.sniperHolding || '0%',
				insiderHoldings: axiomData.tokenInfo.insiderHoldings || '0%',
				bundlers: axiomData.tokenInfo.bundlers || '0',
				lpBurned: axiomData.tokenInfo.lpBurned || '0%',
				holders: axiomData.tokenInfo.holders || '0',
				proTraders: axiomData.tokenInfo.proTraders || '0',
				dexPaid: axiomData.tokenInfo.dexPaid || '0'
			},
			overall: {
				mcap: axiomData.overall.mcap || '0',
				price: axiomData.overall.price || '0',
				liquidity: axiomData.overall.liquidity || '0',
				totalSupply: axiomData.overall.totalSupply || '0'
			},
			timestamped: {
				volume: axiomData.timestamped.volume || '0',
				buyers: axiomData.timestamped.buyers || '0',
				sellers: axiomData.timestamped.sellers || '0',
				netVolume: axiomData.timestamped.netVolume || '0',
				timeframe: axiomData.timestamped.timeframe || '5m'
			}
		};

		// Cache token data for later use
		window.axiomAnalyzerCache = {
			tokenData: {
				price: axiomData.overall.price,
				mcap: axiomData.overall.mcap,
				liquidity: axiomData.overall.liquidity,
				decision: analysisResult.decision,
				score: analysisResult.score
			}
		};

		// 5. Send analysis data to OpenAI through background script
		// console.log('Sending analysis to OpenAI for trading advice...');

		// Update button to indicate waiting for OpenAI
		button.textContent = 'Getting advice...';

		try {
			// Send message to background script to get OpenAI advice
			const response = await chrome.runtime.sendMessage({
				type: 'GET_TRADE_ADVICE',
				analysisResult: analysisResult,
				snapshot: snapshot
			});

			if (response && response.success) {
				if (response.status === 'pending') {
					// console.log('Trade advice request is pending processing by extension page');
					// The advice will come through the message listener
				} else if (response.advice) {
					// console.log('Received trading advice:', response.advice);

					// Show a temporary success message on the button
					button.textContent = 'Advice received!';

					// Open the chat UI with the advice
					chrome.runtime.sendMessage({
						type: 'OPEN_CHAT_WITH_ADVICE',
						advice: response.advice,
						tokenName: getTokenNameFromPage(),
						tokenData: window.axiomAnalyzerCache.tokenData
					});

					// Reset the button text after 2 seconds
					setTimeout(() => {
						button.textContent = originalText;
						button.disabled = false;
					}, 2000);
				}
			} else {
				throw new Error(response?.error || 'Failed to get trading advice');
			}
		} catch (error) {
			// console.error('Failed to get OpenAI trading advice:', error);
			throw new Error('Failed to get AI trading advice');
		}
	} catch (error) {
		// console.error('Axiom Analyzer: Analysis failed:', error);
		button.textContent = 'Analysis Failed';

		// Reset the button text after 2 seconds
		setTimeout(() => {
			button.textContent = originalText;
			button.disabled = false;
		}, 2000);
	}
}

/**
 * Attempts to extract the token name from the page
 */
function getTokenNameFromPage() {
	try {
		// Use the specified XPath to get the token name
		const xpath =
			'/html[1]/body[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/span[1]';
		const tokenNameElement = getElementByXPath(xpath);

		if (tokenNameElement) {
			const tokenName = tokenNameElement.textContent?.trim();
			if (tokenName) {
				return tokenName;
			}
		}

		// Fallback selectors if the XPath doesn't work
		const selectors = [
			'h1', // Common for headings
			'.text-xl', // Common class for token names
			'.font-bold', // Often token names are bold
			'[data-testid="token-name"]' // Custom test ID if it exists
		];

		for (const selector of selectors) {
			const elements = document.querySelectorAll(selector);
			for (const element of elements) {
				const text = element.textContent?.trim();
				if (text && text.length < 30) {
					// Simple heuristic - token names are usually short
					return text;
				}
			}
		}

		// Fallback to URL-based name
		const urlMatch = window.location.pathname.match(/\/meme\/([^\/]+)/i);
		if (urlMatch && urlMatch[1]) {
			return urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
		}

		return 'Unknown Token';
	} catch (error) {
		// console.error('Failed to get token name:', error);
		return 'Unknown Token';
	}
}

/**
 * Gets Axiom token data by sending a message to the background script
 */
async function getAxiomData() {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ type: 'GET_AXIOM_DATA' }, (response) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}

			if (response && response.success && response.data) {
				resolve(response.data);
			} else {
				reject(response?.error || 'Unknown error getting Axiom data');
			}
		});
	});
}

/**
 * Gets GeckoTerminal data by sending a message to the background script
 */
async function getGeckoData(poolAddress, network = 'solana') {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ type: 'GET_GECKO_DATA', poolAddress, network }, (response) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}

			if (response && response.success && response.data) {
				resolve(response.data);
			} else {
				reject(response?.error || 'Unknown error getting GeckoTerminal data');
			}
		});
	});
}

/**
 * Safely converts a Unix timestamp to ISO string format
 * Handles invalid timestamps by returning the current time
 */
function safeTimestampToIsoString(timestamp) {
	// Validate the timestamp
	if (!timestamp || typeof timestamp !== 'number' || isNaN(timestamp) || timestamp <= 0) {
		// Return current time as fallback for invalid timestamps
		return new Date().toISOString();
	}

	try {
		// Multiply by 1000 if it appears to be in seconds rather than milliseconds
		// (Unix timestamps are typically in seconds, JavaScript Date expects milliseconds)
		const milliseconds = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
		return new Date(milliseconds).toISOString();
	} catch (error) {
		console.warn('Invalid timestamp:', timestamp, error);
		return new Date().toISOString();
	}
}

/**
 * Analyzes the available data to produce a trading recommendation
 */
async function analyzeData(axiomData, geckoData) {
	// Convert axiomData to the Snapshot format
	const snapshot = {
		userTrading: {
			bought: axiomData.userTrading.bought || '0',
			sold: axiomData.userTrading.sold || '0',
			holding: axiomData.userTrading.holding || '0',
			pnl: axiomData.userTrading.pnl || '0%',
			balance: axiomData.userTrading.balance || '0'
		},
		tokenInfo: {
			top10Holders: axiomData.tokenInfo.top10Holders || '0%',
			developerHolding: axiomData.tokenInfo.developerHolding || '0%',
			sniperHolding: axiomData.tokenInfo.sniperHolding || '0%',
			insiderHoldings: axiomData.tokenInfo.insiderHoldings || '0%',
			bundlers: axiomData.tokenInfo.bundlers || '0',
			lpBurned: axiomData.tokenInfo.lpBurned || '0%',
			holders: axiomData.tokenInfo.holders || '0',
			proTraders: axiomData.tokenInfo.proTraders || '0',
			dexPaid: axiomData.tokenInfo.dexPaid || '0'
		},
		overall: {
			mcap: axiomData.overall.mcap || '0',
			price: axiomData.overall.price || '0',
			liquidity: axiomData.overall.liquidity || '0',
			totalSupply: axiomData.overall.totalSupply || '0'
		},
		timestamped: {
			volume: axiomData.timestamped.volume || '0',
			buyers: axiomData.timestamped.buyers || '0',
			sellers: axiomData.timestamped.sellers || '0',
			netVolume: axiomData.timestamped.netVolume || '0',
			timeframe: axiomData.timestamped.timeframe || '5m'
		}
	};

	// Initialize candles and trades from gecko data or empty arrays
	const candles = geckoData?.ohlcv || [];
	const trades = geckoData?.trades || [];

	// Convert trades to the format expected by the trading model
	// Using the safeTimestampToIsoString function to prevent errors with invalid timestamps
	const formattedTrades = trades.map((item) => ({
		timestamp: safeTimestampToIsoString(item.timestamp),
		type: item.type,
		price: item.price,
		amount: item.amount,
		txHash: item.txHash
	}));

	// Define the model functions locally
	// (Since we can't import them directly in a content script)

	function parseMoneyString(str) {
		if (!str) return 0;
		const numStr = str.replace(/[^0-9.]/g, '');
		return parseFloat(numStr) || 0;
	}

	function parsePercentString(str) {
		if (!str) return 0;
		const numStr = str.replace('%', '');
		return parseFloat(numStr) / 100 || 0;
	}

	function calculateSMA(candles, period) {
		if (candles.length < period) return 0;
		const relevantCandles = candles.slice(-period);
		const sum = relevantCandles.reduce((acc, candle) => acc + candle.close, 0);
		return sum / period;
	}

	function calculateMomentum(candles) {
		if (candles.length < 30) return 0;
		const currentPrice = candles[candles.length - 1].close;
		const sma30 = calculateSMA(candles, 30);
		return sma30 > 0 ? (currentPrice - sma30) / sma30 : 0;
	}

	function calculateVolumeTrend(candles) {
		if (candles.length < 10) return 0;
		const recentVolume = candles.slice(-5).reduce((sum, candle) => sum + candle.volume, 0);
		const previousVolume = candles.slice(-10, -5).reduce((sum, candle) => sum + candle.volume, 0);
		return previousVolume > 0 ? (recentVolume - previousVolume) / previousVolume : 0;
	}

	function calculateFlowRatio(trades) {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
		const recentTrades = trades.filter((trade) => trade.timestamp >= fiveMinutesAgo);

		if (recentTrades.length === 0) return 1.0; // Neutral if no trades

		const buyAmount = recentTrades
			.filter((trade) => trade.type === 'buy')
			.reduce((sum, trade) => sum + trade.amount, 0);

		const sellAmount = recentTrades
			.filter((trade) => trade.type === 'sell')
			.reduce((sum, trade) => sum + trade.amount, 0);

		// Calculate ratio with safety checks
		let ratio;
		if (sellAmount > 0) {
			ratio = buyAmount / sellAmount;
		} else if (buyAmount > 0) {
			ratio = 2.0; // High but reasonable value when only buys exist
		} else {
			ratio = 1.0; // Neutral
		}

		// Apply a cap to prevent unreasonable values
		// Cap at 5.0 (very bullish) - anything above is likely noise
		return Math.min(ratio, 5.0);
	}

	function analyzeTradingOpportunity(snapshot, candles, trades) {
		// Define weights and thresholds
		const weights = {
			momentum: 0.4,
			volumeTrend: 0.2,
			flowRatio: 0.2,
			liquidityScore: 0.1,
			whaleRisk: 0.1
		};

		const thresholds = {
			buy: 0.15,
			sell: -0.15
		};

		// Calculate individual factors
		let factors = {
			momentum: calculateMomentum(candles),
			volumeTrend: calculateVolumeTrend(candles),
			flowRatio: calculateFlowRatio(trades) - 1.0, // Normalize to 0 being neutral
			liquidityScore: 0,
			whaleRisk: 0
		};

		// Apply sanity checks to all factors to prevent extreme values
		factors = {
			momentum: Math.max(-2, Math.min(2, factors.momentum)), // Cap between -2 and 2
			volumeTrend: Math.max(-3, Math.min(3, factors.volumeTrend)), // Cap between -3 and 3
			flowRatio: Math.max(-3, Math.min(3, factors.flowRatio)), // Cap between -3 and 3
			liquidityScore: Math.max(0, Math.min(5, factors.liquidityScore)), // Cap between 0 and 5
			whaleRisk: Math.max(0, Math.min(1, factors.whaleRisk)) // Cap between 0 and 1
		};

		// Log the normalized factors for debugging
		// console.log('Normalized factors:', factors);

		// Parse relevant metrics from snapshot
		const liquidity = parseMoneyString(snapshot.overall.liquidity);
		const mcap = parseMoneyString(snapshot.overall.mcap);

		// Calculate on-chain / fundamental factors
		if (mcap > 0) {
			factors.liquidityScore = Math.min(5, liquidity / mcap); // Cap at 5
		}

		factors.whaleRisk =
			parsePercentString(snapshot.tokenInfo.top10Holders) +
			parsePercentString(snapshot.tokenInfo.developerHolding) +
			parsePercentString(snapshot.tokenInfo.insiderHoldings);

		// Cap whale risk at 1 (100%)
		factors.whaleRisk = Math.min(1, factors.whaleRisk);

		// Calculate weighted composite score
		const score =
			weights.momentum * factors.momentum +
			weights.volumeTrend * factors.volumeTrend +
			weights.flowRatio * factors.flowRatio +
			weights.liquidityScore * factors.liquidityScore -
			weights.whaleRisk * factors.whaleRisk;

		// Cap the final score to a reasonable range (-1 to 1)
		const cappedScore = Math.max(-1, Math.min(1, score));

		// Determine decision based on thresholds
		let decision = 'HOLD';
		if (cappedScore >= thresholds.buy) {
			decision = 'BUY';
		} else if (cappedScore <= thresholds.sell) {
			decision = 'SELL';
		}

		return {
			decision,
			score: cappedScore,
			factors
		};
	}

	// Perform the analysis
	return analyzeTradingOpportunity(snapshot, candles, formattedTrades);
}

/**
 * Extracts the pool address from the current URL
 */
function getPoolAddressFromUrl() {
	const url = window.location.href;
	const match = url.match(/axiom\.trade\/meme\/([a-zA-Z0-9]{32,44})/i);
	return match ? match[1] : null;
}

/**
 * Gets an element by XPath
 */
function getElementByXPath(xpath) {
	return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
		.singleNodeValue;
}

/**
 * Monitors network requests to detect SPA navigation
 * This can help detect changes that don't trigger URL changes
 */
function setupNetworkMonitoring() {
	// Use the performance API to observe network requests
	if (window.PerformanceObserver) {
		try {
			// Create a performance observer to monitor network requests
			const observer = new PerformanceObserver(
				throttle((list) => {
					// Get the entries from the observer
					const entries = list.getEntries();

					// Check if any of the entries are API calls that might indicate page navigation
					const navigationApis = entries.filter((entry) => {
						const url = entry.name.toLowerCase();
						return (
							// Look for token or trade-related API endpoints
							(url.includes('/api/') || url.includes('/v1/') || url.includes('/v2/')) &&
							(url.includes('token') ||
								url.includes('meme') ||
								url.includes('trade') ||
								url.includes('chart') ||
								url.includes('pool'))
						);
					});

					// If we found relevant API calls, check if we need to reinitialize
					if (navigationApis.length > 0) {
						// console.log('Axiom Analyzer: Detected relevant API calls, checking initialization');
						if (window.location.href.match(/^https?:\/\/(www\.)?axiom\.trade\/meme\/.+/i)) {
							// We're on a meme page - check if the button needs to be injected
							if (!document.getElementById('him-analyzer-button') && !buttonInjected) {
								// console.log(
								// 	'Axiom Analyzer: API activity detected on meme page, attempting button injection'
								// );
								setTimeout(injectAnalyzerButton, 1000);
							}
						}
					}
				}, 1000)
			); // Throttle to prevent excessive processing

			// Start observing network requests
			observer.observe({ entryTypes: ['resource'] });
			// console.log('Axiom Analyzer: Network request monitoring initialized');
		} catch (error) {
			console.warn('Axiom Analyzer: Error setting up network monitoring:', error);
		}
	}
}
