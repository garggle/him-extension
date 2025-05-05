/**
 * OpenAI API service for the Chrome extension
 * Handles direct API calls to OpenAI without requiring a server
 */

import { DEFAULT_OPENAI_API_KEY } from '../../../shared/constants/api-keys.js';

// Constants
const SYSTEM_PROMPT = `Use words that are understandable by a 12 year old. Wait for the user to give you signals or ask you questions. No caps. Be as concise as possible. The user is a Solana memecoin trader on Photon.

If the user gives you signals, you should analyze the signals and give a quick, natural take on the volume, wallet moves, social sentiment, and chart action. No caps. Sentences are short, loose, and to the point. Often speaks in sentence fragments. If you can say something in one sentence, do not say more. No emojis.

You mix smart analysis with gut feel. Notice when whales move, retail panics, or volume spikes weirdly. Don't lecture or explain too much, just drops what matters in a noob-friendly way.

Use crypto slang, but not constantly. No hype talk, stay rational. If a setup looks promising, show interest and give advice on what strategy to use. If it looks risky, give chill warnings.

Sprinkle in metaphors or vivid language only when it fits the moment, like something you'd naturally say if you've seen enough charts go sideways.

Use numbers naturally — like 8.5M cap, 157k volume in 5 min, <50k wallets — to back up the read. Always combines market signals with sentiment and narrative.

When analyzing trading opportunities, be direct about whether to buy, sell, or hold, but also explain why in a casual yet insightful way. If the model score is high, express confidence; if it's low or negative, express caution. Consider liquidity, momentum, and whale risk in your assessment.

Sound like a smart friend watching the chart with you, not a bot, not a clown, not a professor. Be understandable by a stupid 12 year old.`;

// Interface for history messages
export interface HistoryMessage {
	sender: 'self' | 'other' | 'system';
	text: string;
}

/**
 * Stores the OpenAI API key in Chrome storage
 */
export async function storeApiKey(apiKey: string): Promise<void> {
	try {
		// Store directly in Chrome's storage.sync
		await chrome.storage.sync.set({
			openaiApiKey: apiKey
		});
	} catch (error) {
		console.error('Error storing API key:', error);
		throw new Error('Failed to store API key');
	}
}

/**
 * Retrieves the OpenAI API key from Chrome storage
 * Falls back to the default API key if not found
 */
export async function getApiKey(): Promise<string> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get(['openaiApiKey'], (result) => {
			try {
				// First try to get user's configured key
				if (
					result.openaiApiKey &&
					typeof result.openaiApiKey === 'string' &&
					result.openaiApiKey.trim().startsWith('sk-')
				) {
					resolve(result.openaiApiKey);
					return;
				}

				// Fall back to default key
				resolve(DEFAULT_OPENAI_API_KEY);
			} catch (error) {
				console.error('Error retrieving API key:', error);
				// Fall back to default key on error
				resolve(DEFAULT_OPENAI_API_KEY);
			}
		});
	});
}

/**
 * Checks if an API key exists in storage or default is available
 */
export async function hasApiKey(): Promise<boolean> {
	return new Promise((resolve) => {
		chrome.storage.sync.get(['openaiApiKey'], (result) => {
			// Check both existence and basic validity of user key
			const isUserKeyValid =
				!!result.openaiApiKey &&
				typeof result.openaiApiKey === 'string' &&
				result.openaiApiKey.trim().startsWith('sk-');

			// If user has a valid key or we have a default key, return true
			resolve(isUserKeyValid || DEFAULT_OPENAI_API_KEY.startsWith('sk-'));
		});
	});
}

/**
 * Merges adjacent messages from the same sender to create a proper conversation history
 * for the OpenAI API, combining consecutive assistant messages
 */
function prepareHistoryForApi(history: HistoryMessage[]): HistoryMessage[] {
	// If empty or just one message, return as is
	if (history.length <= 1) return history;

	const mergedHistory: HistoryMessage[] = [];
	let currentSender: 'self' | 'other' | 'system' | null = null;
	let currentText = '';

	// Process each message
	for (const msg of history) {
		// If this is the first message or a different sender than the previous
		if (currentSender !== msg.sender) {
			// If we have accumulated text, push it
			if (currentText) {
				mergedHistory.push({
					sender: currentSender!,
					text: currentText.trim()
				});
			}

			// Start a new accumulated message
			currentSender = msg.sender;
			currentText = msg.text;
		} else {
			// Same sender, append text with a space
			currentText += ' ' + msg.text;
		}
	}

	// Don't forget to add the last message
	if (currentText) {
		mergedHistory.push({
			sender: currentSender!,
			text: currentText.trim()
		});
	}

	return mergedHistory;
}

/**
 * Makes a request to the OpenAI Chat Completions API
 */
export async function sendChatRequest(
	message: string,
	history: HistoryMessage[] = []
): Promise<string> {
	try {
		// Get the API key
		const apiKey = await getApiKey();

		// Merge consecutive messages from the same sender
		const mergedHistory = prepareHistoryForApi(history);

		// Prepare the messages for the API call
		const messages = [
			{ role: 'system', content: SYSTEM_PROMPT },
			// Add previous conversation history
			...mergedHistory.map((msg) => ({
				role: msg.sender === 'self' ? ('user' as const) : ('assistant' as const),
				content: msg.text
			})),
			// Add the current message
			{ role: 'user' as const, content: message }
		];

		// Call the OpenAI API
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4.1',
				messages: messages,
				response_format: { type: 'json_object' }
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			if (response.status === 401) {
				throw new Error('Invalid API key. Please reconfigure your OpenAI API key.');
			} else {
				throw new Error(
					`OpenAI API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`
				);
			}
		}

		const data = await response.json();
		return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
	} catch (error) {
		console.error('Error calling OpenAI API:', error);
		throw error;
	}
}
