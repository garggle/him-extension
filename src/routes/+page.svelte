<script lang="ts">
	import ApiKeySetup from '$lib/features/chat/ApiKeySetup.svelte';
	import ChatArea from '$lib/features/chat/ChatArea.svelte';
	import {
		hasApiKey,
		sendChatRequest,
		type HistoryMessage
	} from '$lib/features/chat/data/openai-api.js';
	import {
		getTradeAdvice,
		type TradingAdviceCards
	} from '$lib/features/chat/data/trading-analyzer.js';
	import InputArea from '$lib/features/chat/InputArea.svelte';
	import { splitIntoMessages } from '$lib/shared/utils/message-splitter.js';
	import { onMount } from 'svelte';

	// Define the message interface
	interface Message {
		id: number;
		sender: 'self' | 'other' | 'system';
		text: string;
		metadata?: {
			buys?: number;
			sells?: number;
			value?: string;
		};
	}

	// State management using Svelte 5 runes
	let messages = $state<Message[]>([]);
	let isLoading = $state(false);
	let apiKeyConfigured = $state(false);
	let apiKeyError = $state('');
	let nextId = 1;
	let isTyping = $state(false);

	// Check API key status on mount and listen for trade advice messages
	onMount(() => {
		checkApiKeyStatus();
		checkForTradeAdvice();
		listenForTradeAdvice();
		listenForTradeAdviceRequests();
	});

	async function checkApiKeyStatus() {
		try {
			apiKeyConfigured = await hasApiKey();
			apiKeyError = '';
		} catch (error) {
			console.error('Error checking API key status:', error);
			apiKeyConfigured = false;
		}
	}

	// Check if there's any trade advice stored in the session
	async function checkForTradeAdvice() {
		try {
			// Get any stored trade advice from extension storage
			const result = await chrome.storage.session.get('tradeAdvice');

			if (result.tradeAdvice) {
				// Get the trade advice data
				const { message, tokenName, tokenData, timestamp } = result.tradeAdvice;

				// Only use it if it's recent (less than 30 seconds old)
				const isRecent = Date.now() - timestamp < 30000;

				if (isRecent && message) {
					// Add a system message about the token analysis
					messages = [
						...messages,
						{
							id: nextId++,
							sender: 'system',
							text: `Analysis for \$${tokenName || 'error'}:\nMCap: ${tokenData?.mcap || 'N/A'} Liq: ${tokenData?.liquidity || 'N/A'}`
						}
					];

					// Add the AI advice message with fake typing
					isTyping = true;

					try {
						// Try to parse the message as JSON
						let adviceObject;
						if (typeof message === 'string') {
							adviceObject = JSON.parse(message);
						} else {
							adviceObject = message; // Already an object
						}

						// Check if it's our new card format or legacy format
						if (adviceObject.actionStrategy && adviceObject.finalCall) {
							// New card format - create formatted messages from cards
							const cardMessages = formatCardMessages(adviceObject);
							await addMessagesProgressively(cardMessages);
						} else if (adviceObject.legacyFormat && adviceObject.text) {
							// Legacy format but wrapped in our compatibility object
							const messageChunks = splitIntoMessages(adviceObject.text);
							await addMessagesProgressively(messageChunks);
						} else {
							// Plain text or unknown format, try to use as is
							const messageChunks = splitIntoMessages(
								typeof message === 'string' ? message : JSON.stringify(message)
							);
							await addMessagesProgressively(messageChunks);
						}
					} catch (error) {
						console.error('Error processing advice format:', error);
						// Fallback to treating as plain text
						const messageChunks = splitIntoMessages(
							typeof message === 'string' ? message : JSON.stringify(message)
						);
						await addMessagesProgressively(messageChunks);
					}

					// Clear the stored advice to prevent showing it again
					await chrome.storage.session.remove('tradeAdvice');
				}
			}
		} catch (error) {
			console.error('Error checking for trade advice:', error);
		}
	}

	// Listen for runtime messages about new trade advice
	function listenForTradeAdvice() {
		chrome.runtime.onMessage.addListener(async (message) => {
			if (message.type === 'NEW_TRADE_ADVICE') {
				const { advice, tokenName, tokenData } = message;

				if (advice) {
					// Add a system message about the token analysis
					messages = [
						...messages,
						{
							id: nextId++,
							sender: 'system',
							text: `Analysis for \$${tokenName || 'error'}:\nMCap: ${tokenData?.mcap || 'N/A'} Liq: ${tokenData?.liquidity || 'N/A'}`
						}
					];

					// Add the AI advice message with fake typing
					isTyping = true;

					try {
						// Try to parse the advice as JSON
						let adviceObject;
						if (typeof advice === 'string') {
							adviceObject = JSON.parse(advice);
						} else {
							adviceObject = advice; // Already an object
						}

						// Check if it's our new card format or legacy format
						if (adviceObject.actionStrategy && adviceObject.finalCall) {
							// New card format - create formatted messages from cards
							const cardMessages = formatCardMessages(adviceObject);
							await addMessagesProgressively(cardMessages);
						} else if (adviceObject.legacyFormat && adviceObject.text) {
							// Legacy format but wrapped in our compatibility object
							const messageChunks = splitIntoMessages(adviceObject.text);
							await addMessagesProgressively(messageChunks);
						} else {
							// Plain text or unknown format, try to use as is
							const messageChunks = splitIntoMessages(
								typeof advice === 'string' ? advice : JSON.stringify(advice)
							);
							await addMessagesProgressively(messageChunks);
						}
					} catch (error) {
						console.error('Error processing advice format:', error);
						// Fallback to treating as plain text
						const messageChunks = splitIntoMessages(
							typeof advice === 'string' ? advice : JSON.stringify(advice)
						);
						await addMessagesProgressively(messageChunks);
					}
				}
			}
		});
	}

	// Listen for requests to process trade advice
	function listenForTradeAdviceRequests() {
		chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
			if (message.type === 'PROCESS_TRADE_ADVICE') {
				console.log('Extension page received request to process trade advice');

				// Let background script know we're here and processing
				sendResponse({ received: true });

				try {
					// Get the pending analysis from session storage
					const result = await chrome.storage.session.get('pendingAnalysis');

					if (result.pendingAnalysis) {
						const { analysisResult, snapshot, timestamp } = result.pendingAnalysis;

						// Only process if it's recent (less than 30 seconds old)
						const isRecent = Date.now() - timestamp < 30000;

						if (isRecent && analysisResult) {
							// Use the OpenAI API to get trade advice
							console.log('Processing trade advice request', analysisResult);

							// Get API key and check if configured
							if (!(await hasApiKey())) {
								console.error('Cannot process trade advice: OpenAI API key not configured');

								// Open the extension to allow the user to configure the API key
								return;
							}

							// Get the trade advice
							const advice = await getTradeAdvice(analysisResult, snapshot);
							console.log('Trade advice generated:', advice);

							// Send the advice back to the background script
							chrome.runtime.sendMessage({
								type: 'TRADE_ADVICE_READY',
								tabId: message.origin,
								advice: advice
							});

							// Clear the pending analysis
							await chrome.storage.session.remove('pendingAnalysis');
						} else if (!isRecent) {
							console.warn('Pending analysis is too old, ignoring');
							await chrome.storage.session.remove('pendingAnalysis');
						}
					}
				} catch (error) {
					console.error('Error processing trade advice request:', error);
				}

				return false; // No async response needed
			}
		});
	}

	// Reset the API key configuration and show setup screen
	async function resetApiConfig() {
		try {
			await chrome.storage.sync.remove('openaiApiKey');
			apiKeyConfigured = false;
			apiKeyError = '';
		} catch (error) {
			console.error('Error resetting API key:', error);
		}
	}

	// Variable for the current input text
	let currentInput = $state('');

	/**
	 * Add a message with a delay to simulate typing
	 */
	function addMessageWithDelay(message: Message, delay: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(() => {
				messages = [...messages, message];
				resolve();
			}, delay);
		});
	}

	/**
	 * Add messages progressively with delay between each
	 */
	async function addMessagesProgressively(messageChunks: string[]) {
		// Note: isTyping is already set to true before this function is called

		// Create all message objects immediately
		const newMessages = messageChunks.map((chunk) => ({
			id: nextId++,
			sender: 'other' as 'self' | 'other' | 'system',
			text: chunk
		}));

		// Add all new messages to the state at once
		messages = [...messages, ...newMessages];

		// Turn off typing indicator now that all messages are added
		isTyping = false;
	}

	async function handleSend(userMessage: string) {
		// Add user message to chat
		messages = [
			...messages,
			{
				id: nextId++,
				sender: 'self',
				text: userMessage
			}
		];

		// Show typing indicator immediately
		isTyping = true;

		// Set loading state (internal)
		isLoading = true;

		try {
			// Send request directly to OpenAI
			const reply = await sendChatRequest(
				userMessage,
				// Send only the last 10 messages to keep the context manageable
				messages.slice(-10) as HistoryMessage[]
			);

			// Split the response into multiple messages if needed
			const messageChunks = splitIntoMessages(reply);

			// Set loading to false as we're now using typing indicator
			isLoading = false;

			// Add message chunks progressively with delays
			await addMessagesProgressively(messageChunks);
		} catch (error: unknown) {
			console.error('Error calling OpenAI API:', error);

			// Hide typing indicator on error
			isTyping = false;

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Check if it's an API key error
			if (errorMessage.includes('API key')) {
				apiKeyError = errorMessage;
				// Force a recheck of the API key status
				apiKeyConfigured = false;
			}

			// Add error message
			messages = [
				...messages,
				{
					id: nextId++,
					sender: 'system',
					text: 'Failed to get a response: ' + errorMessage
				}
			];
		} finally {
			isLoading = false;
			// Note: isTyping is now managed in addMessagesProgressively
			// and is set to false when done or in the catch block on error
		}
	}

	// Format the cards into message chunks
	function formatCardMessages(cards: TradingAdviceCards): string[] {
		const messages: string[] = [];

		// Action Strategy card
		let actionMessage = `${cards.actionStrategy.header}\n`;
		actionMessage += `Entry: ${cards.actionStrategy.body.entry}\n`;
		actionMessage += `TP/SL: ${cards.actionStrategy.body.tp_sl}\n`;
		actionMessage += `Timeframe: ${cards.actionStrategy.body.timeframe}\n`;
		actionMessage += `Reason: ${cards.actionStrategy.body.reason}`;
		messages.push(actionMessage);

		// Liquidity card
		let liquidityMessage = `${cards.liquidityPump.header}\n`;
		liquidityMessage += `Liquidity: ${cards.liquidityPump.body.liquidity}\n`;
		liquidityMessage += `Volume: ${cards.liquidityPump.body.net_volume}\n`;
		liquidityMessage += `Buyers/Sellers: ${cards.liquidityPump.body.buyer_seller_ratio}\n`;
		liquidityMessage += `${cards.liquidityPump.body.interpretation}`;
		messages.push(liquidityMessage);

		// Holder Structure card
		let holderMessage = `${cards.holderStructure.header}\n`;
		holderMessage += `Holders: ${cards.holderStructure.body.holders}\n`;
		holderMessage += `Pro traders: ${cards.holderStructure.body.pro_traders}\n`;
		holderMessage += `Top 10: ${cards.holderStructure.body.top_10_pct}\n`;
		holderMessage += `${cards.holderStructure.body.interpretation}`;
		messages.push(holderMessage);

		// Manipulation Risk card
		let riskMessage = `${cards.manipulationRisk.header}\n`;
		riskMessage += `Insider: ${cards.manipulationRisk.body.insider_pct}\n`;
		riskMessage += `Dev: ${cards.manipulationRisk.body.dev_pct}\n`;
		riskMessage += `Snipers: ${cards.manipulationRisk.body.snipers_pct}\n`;
		riskMessage += `LP Burned: ${cards.manipulationRisk.body.lp_burned_pct}\n`;
		riskMessage += `Bundlers: ${cards.manipulationRisk.body.bundlers_pct}\n`;
		riskMessage += `${cards.manipulationRisk.body.interpretation}`;
		messages.push(riskMessage);

		// Final Call card
		let finalMessage = `${cards.finalCall.header}\n`;
		finalMessage += `Based on: ${cards.finalCall.body.based_on.join(', ')}\n`;
		finalMessage += `${cards.finalCall.body.text}`;
		messages.push(finalMessage);

		return messages;
	}
</script>

<div class="flex flex-col h-full w-full">
	<!-- Header -->
	<header class="p-2">
		<div class="flex justify-center">
			<h1
				class="w-[288px] h-[30px] font-['Space_Mono'] font-bold text-[20px] leading-[30px] text-[#EED2FF] text-center"
				style="text-shadow: 0px 0px 8px rgba(238, 210, 255, 0.7);"
			>
				him
			</h1>
		</div>
	</header>

	{#if !apiKeyConfigured}
		<!-- API Key Setup UI -->
		<div class="flex-1 flex items-center justify-center p-4">
			{#if apiKeyError}
				<div
					class="text-red-400 text-sm mb-4 absolute top-[60px] p-2 bg-red-950/30 rounded border border-red-900/50"
				>
					{apiKeyError}
				</div>
			{/if}
			<ApiKeySetup onComplete={() => (apiKeyConfigured = true)} />
		</div>
	{:else}
		<!-- Chat area (messages) -->
		<ChatArea {messages} {isTyping} />

		<!-- Input area -->
		<div class="relative">
			{#if apiKeyError}
				<div class="absolute bottom-full left-0 right-0 mb-2 flex justify-center">
					<button
						on:click={resetApiConfig}
						class="text-sm text-red-400 bg-red-950/30 px-3 py-1 rounded border border-red-900/50"
					>
						API Key Error - Click to reconfigure
					</button>
				</div>
			{/if}
			<InputArea bind:value={currentInput} onsend={handleSend} disabled={isLoading || isTyping} />
		</div>
	{/if}
</div>
