<script lang="ts">
	import ChatArea from '$lib/components/ChatArea.svelte';
	import InputArea from '$lib/components/InputArea.svelte';

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

	async function handleSend(event: CustomEvent<string>) {
		const userMessage = event.detail;

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
			// Make API call to OpenAI
			const response = await fetch('/api/chat', {
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
	<InputArea bind:value={currentInput} on:send={handleSend} disabled={isLoading} />
</div>
