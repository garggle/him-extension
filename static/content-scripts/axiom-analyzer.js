/**
/**
 * Axiom analyzer content script
 * Injects a "What should I do?" button into Axiom meme token pages
 */

// Only execute on pages matching the Axiom meme token pattern
if (window.location.href.match(/^https?:\/\/(www\.)?axiom\.trade\/meme\/.+/i)) {
	console.log('Axiom Analyzer: Initializing on meme token page');

	// Wait for the page to be fully loaded
	window.addEventListener('load', () => {
		setTimeout(injectAnalyzerButton, 1000); // Wait an additional second for SPA to settle
	});

	// Listen for messages from the background script
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.type === 'TRADE_ADVICE_RESULT' && message.advice) {
			// We received the trade advice from the extension page
			console.log('Received trade advice result:', message.advice);

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
}

// Global cache for analysis data
window.axiomAnalyzerCache = {};

/**
 * Injects the analysis button into the page
 */
function injectAnalyzerButton() {
	try {
		// Try to find the target element using XPath
		const targetXPath =
			'/html/body/div[1]/div[3]/div/div/div/div/div[2]/div[2]/div[2]/div/div[1]/div[4]';
		const targetElement = getElementByXPath(targetXPath);

		if (!targetElement) {
			console.warn('Axiom Analyzer: Target element not found. Button not injected.');
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

		// Find the parent that contains the flex layout
		const flexContainer = targetElement.closest('.flex.flex-row');

		// If we found the flex container, add our button after it
		if (flexContainer && flexContainer.parentNode) {
			flexContainer.parentNode.insertBefore(buttonWrapper, flexContainer.nextSibling);
		} else {
			// Fallback: try to place it after the target's parent div
			const parentContainer = targetElement.parentNode;
			if (parentContainer && parentContainer.parentNode) {
				parentContainer.parentNode.insertBefore(buttonWrapper, parentContainer.nextSibling);
			} else {
				// Last resort: just append to the target element
				targetElement.appendChild(buttonWrapper);
			}
		}

		console.log('Axiom Analyzer: Button successfully injected');
	} catch (error) {
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
		console.log('Axiom Analyzer: Starting analysis');

		// 1. Get Axiom data from the page
		const axiomData = await getAxiomData();
		if (!axiomData) {
			throw new Error('Failed to get token data');
		}

		console.log('Axiom Analyzer: Token data retrieved:', axiomData);

		// 2. Try to get GeckoTerminal data if possible
		const poolAddress = getPoolAddressFromUrl();
		let geckoData = null;

		if (poolAddress) {
			try {
				geckoData = await getGeckoData(poolAddress);
				console.log('Axiom Analyzer: GeckoTerminal data retrieved:', geckoData);
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
				sellers: axiomData.timestamped.sellers || '0'
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
		console.log('Sending analysis to OpenAI for trading advice...');

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
					console.log('Trade advice request is pending processing by extension page');
					// The advice will come through the message listener
				} else if (response.advice) {
					console.log('Received trading advice:', response.advice);

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
			console.error('Failed to get OpenAI trading advice:', error);
			throw new Error('Failed to get AI trading advice');
		}
	} catch (error) {
		console.error('Axiom Analyzer: Analysis failed:', error);
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
		// Try various selectors to find the token name
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
		console.error('Failed to get token name:', error);
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
			sellers: axiomData.timestamped.sellers || '0'
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
		console.log('Normalized factors:', factors);

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
