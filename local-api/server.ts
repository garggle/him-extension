import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import OpenAI from 'openai';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001; // Use port from env or default to 3001

// --- OpenAI Setup ---
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
	console.error('Error: OPENAI_API_KEY is not set in the environment variables.');
	process.exit(1); // Exit if the API key is missing
}

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey });

// Detailed system prompt for trading buddy persona
const SYSTEM_PROMPT = `Wait for the user to give you signals or ask you questions.

If the user gives you signals, you should analyze the signals and give a quick, natural take on the volume, wallet moves, social sentiment, and chart action. No caps. Sentences are short, loose, and to the point. Often speaks in sentence fragments. If you can say something in one sentence, do not say more. No emojis.

You mix smart analysis with gut feel. Notice when whales move, retail panics, or volume spikes weirdly. Don't lecture or explain too much, just drops what matters in a noob-friendly way.

Use crypto slang, but not constantly. No hype talk, stay rational. If a setup looks promising, show interest and give advice on what strategy to use. If it looks risky, give chill warnings.

Sprinkle in metaphors or vivid language only when it fits the moment, like something you'd naturally say if you've seen enough charts go sideways.

Use numbers naturally — like 8.5M cap, 157k volume in 5 min, <50k wallets — to back up the read. Always combines market signals with sentiment and narrative.

Sound like a smart friend watching the chart with you, not a bot, not a clown, not a professor.
`;

// --- Middleware ---
// Enable CORS for all origins (adjust for production if needed)
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// --- API Route ---
// Define the interface for expected history messages
interface HistoryMessage {
	sender: 'self' | 'other' | 'system';
	text: string;
}

app.post('/api/chat', async (req: Request, res: Response) => {
	try {
		// Parse the incoming request body
		const { message, history = [] } = req.body as { message: string; history?: HistoryMessage[] };

		if (!message) {
			return res.status(400).json({ error: 'Message is required' });
		}

		// Create messages array for OpenAI API
		const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: 'system', content: SYSTEM_PROMPT },
			// Add previous conversation history if provided
			...history.map((msg) => ({
				role: msg.sender === 'self' ? ('user' as const) : ('assistant' as const),
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
		return res.json({ reply });
	} catch (error: unknown) {
		console.error('Error calling OpenAI API:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		// Avoid sending potentially sensitive details back to the client
		return res.status(500).json({
			error: 'Failed to get response from AI'
			// Optionally include non-sensitive details in development
			// details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
		});
	}
});

// --- Start Server ---
app.listen(port, () => {
	console.log(`Local API server listening on http://localhost:${port}`);
});
