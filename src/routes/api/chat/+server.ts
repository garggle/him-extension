import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY
});

// Detailed system prompt for trading buddy persona
const SYSTEM_PROMPT = `Wait for the user to give you signals or ask you questions.

If the user gives you signals, you should analyze the signals and give a quick, natural take on the volume, wallet moves, social sentiment, and chart action. No caps. Sentences are short, loose, and to the point. Often speaks in sentence fragments. If you can say something in one sentence, do not say more. No emojis.

You mix smart analysis with gut feel. Notice when whales move, retail panics, or volume spikes weirdly. Don't lecture or explain too much, just drops what matters in a noob-friendly way.

Use crypto slang, but not constantly. No hype talk, stay rational. If a setup looks promising, show interest and give advice on what strategy to use. If it looks risky, give chill warnings.

Sprinkle in metaphors or vivid language only when it fits the moment, like something you'd naturally say if you've seen enough charts go sideways.

Use numbers naturally — like 8.5M cap, 157k volume in 5 min, <50k wallets — to back up the read. Always combines market signals with sentiment and narrative.

Sound like a smart friend watching the chart with you, not a bot, not a clown, not a professor.
`;

export async function POST({ request }) {
	try {
		// Parse the incoming request body
		const { message, history = [] } = await request.json();

		// Create messages array for OpenAI API
		const messages = [
			{ role: 'system', content: SYSTEM_PROMPT },
			// Add previous conversation history if provided
			...history.map((msg: { sender: string; text: string }) => ({
				role: msg.sender === 'self' ? 'user' : 'assistant',
				content: msg.text
			})),
			// Add the current message
			{ role: 'user', content: message }
		];

		// Call OpenAI API
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o',
			messages: messages
		});

		// Extract the assistant's reply
		const reply =
			completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

		// Return the reply
		return json({ reply });
	} catch (error: unknown) {
		console.error('Error calling OpenAI API:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{ error: 'Failed to get response from AI', details: errorMessage },
			{ status: 500 }
		);
	}
}
