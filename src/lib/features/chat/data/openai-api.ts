/**
 * OpenAI API service for the Chrome extension
 * Handles API calls through our backend server
 */

// Interface for history messages
export interface HistoryMessage {
	sender: 'self' | 'other' | 'system';
	text: string;
}

/**
 * Makes a request to our backend OpenAI API endpoint
 */
export async function sendChatRequest(
	message: string,
	history: HistoryMessage[] = [],
	isJsonResponse: boolean = false
): Promise<string> {
	try {
		// Call our backend API
		const response = await fetch('https://him-api.vercel.app/api/openai', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message,
				history,
				isJsonResponse
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to get response from server');
		}

		const data = await response.json();
		return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
	} catch (error) {
		console.error('Error calling OpenAI API:', error);
		throw error;
	}
}

// Remove unused functions since we're not managing API keys in the frontend anymore
export async function storeApiKey(apiKey: string): Promise<void> {
	throw new Error('API key management is now handled by the backend');
}

export async function getApiKey(): Promise<string> {
	throw new Error('API key management is now handled by the backend');
}

export async function hasApiKey(): Promise<boolean> {
	return true; // Always return true since we're using backend API key
}
