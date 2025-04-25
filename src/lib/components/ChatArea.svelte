<script lang="ts">
	import MessageBubble from './MessageBubble.svelte';

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

	export let messages: Message[] = [];
</script>

<div class="flex-1 overflow-y-auto p-2 space-y-3">
	{#each messages as message (message.id)}
		<MessageBubble text={message.text} sender={message.sender} metadata={message.metadata} />
	{/each}
</div>
