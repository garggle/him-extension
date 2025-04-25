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

	// Sample messages based on the provided image
	const messages: Message[] = [
		{
			id: 1,
			sender: 'system',
			text: 'vol just popped. {value} in 5 minutes. also, some whales preheating the oven.',
			metadata: { value: '157k' }
		},
		{
			id: 2,
			sender: 'other',
			text: 'ye but those sell walls look nastyyy {buys} buys {sells} sells bro',
			metadata: { buys: 269, sells: 158 }
		},
		{
			id: 3,
			sender: 'system',
			text: "buy pressure's weak sauce, bro. sentiment's shaky"
		},
		{
			id: 4,
			sender: 'system',
			text: 'TG is 60% fear, 30% cope, 10% memes + wallets with <50k are panic selling. classic retail flush.'
		},
		{
			id: 5,
			sender: 'self',
			text: 'so what, sit out?'
		},
		{
			id: 6,
			sender: 'other',
			text: "if you ape now, you're catching a falling knife with no handle"
		},
		{
			id: 7,
			sender: 'other',
			text: 'better to let the plebs exhaust themselves'
		},
		{
			id: 8,
			sender: 'other',
			text: 'if it reclaims {value} cap with healthy CEX volume then we talk',
			metadata: { value: '8.5M' }
		},
		{
			id: 9,
			sender: 'self',
			text: 'alr, ill watch. ping me if it flips pls'
		},
		{
			id: 10,
			sender: 'other',
			text: 'u got it king'
		}
	];

	// Variable for the current input text
	let currentInput = '';

	// Handle sending a message (placeholder for now)
	function handleSend(event: CustomEvent<string>) {
		console.log('Sending:', event.detail);
	}
</script>

<div class="flex flex-col h-full w-full">
	<!-- Header -->
	<header class="p-2 border-b border-purple-700/30">
		<h1 class="text-md font-orbitron text-glow-purple text-center">
			<span class="text-primary">*</span> Him <span class="text-primary">*</span>
		</h1>
	</header>

	<!-- Chat area (messages) -->
	<ChatArea {messages} />

	<!-- Input area -->
	<InputArea bind:value={currentInput} on:send={handleSend} />
</div>
