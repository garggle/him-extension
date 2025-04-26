<script lang="ts">
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { axiomService } from '$lib/features/axiom/index.js';
	import ChatArea from '$lib/features/chat/ChatArea.svelte';
	import InputArea from '$lib/features/chat/InputArea.svelte';

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

	let messages: Message[] = [];
	let isLoading = false;
	let nextId = 1;

	// Variable for the current input text
	let currentInput = '';

	// Axiom data status
	let axiomDataStatus = '';

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

		// Set loading state
		isLoading = true;

		try {
			// Make API call to configured base URL
			const apiUrl = `${PUBLIC_API_BASE_URL}/api/chat`;
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: userMessage,
					// Send only the last 10 messages to keep the context manageable
					history: messages.slice(-10)
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Add AI response to chat
			messages = [
				...messages,
				{
					id: nextId++,
					sender: 'other',
					text: data.reply
				}
			];
		} catch (error) {
			console.error('Error calling chat API:', error);

			// Add error message
			messages = [
				...messages,
				{
					id: nextId++,
					sender: 'system',
					text: 'Failed to get a response. Please try again.'
				}
			];
		} finally {
			isLoading = false;
		}
	}

	// Function to fetch Axiom data and log to console
	async function fetchAxiomData() {
		try {
			axiomDataStatus = 'Fetching data...';
			const tokenData = await axiomService.getTokenData();

			if (tokenData) {
				console.log('Axiom Token Data:', tokenData);
				axiomDataStatus = 'Data fetched successfully! Check the console.';
			} else {
				console.log('Not on an Axiom meme token page. URL must match axiom.trade/meme/{tokenId}');
				axiomDataStatus = 'Not on an Axiom meme page. Must be on axiom.trade/meme/{tokenId}';
			}
		} catch (error) {
			console.error('Error fetching Axiom data:', error);
			axiomDataStatus = 'Error fetching data. Check console for details.';
		}
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
				Him
			</h1>
		</div>
	</header>

	<!-- Chat area (messages) -->
	<ChatArea {messages} />

	<!-- Loading indicator (if needed) -->
	{#if isLoading}
		<div class="text-center text-sm text-[#EED2FF]/70 p-1">Thinking...</div>
	{/if}

	<!-- Input area -->
	<InputArea bind:value={currentInput} onsend={handleSend} disabled={isLoading} />

	<!-- Axiom Data Fetcher Button -->
	<div class="p-2 mt-2 border-t border-gray-800">
		<button
			on:click={fetchAxiomData}
			class="w-full py-2 px-4 bg-purple-800 hover:bg-purple-700 rounded text-sm text-white transition-colors"
		>
			Fetch Axiom Token Data
		</button>
		{#if axiomDataStatus}
			<p class="text-xs mt-1 text-center text-gray-300">{axiomDataStatus}</p>
		{/if}
	</div>
</div>
