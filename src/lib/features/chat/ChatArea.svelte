<script lang="ts">
	export const prerender = true;

	import MessageBubble from '$lib/features/chat/MessageBubble.svelte';
	import TypingIndicator from '$lib/features/chat/TypingIndicator.svelte';
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

	export let messages: Message[] = [];
	export let isTyping = false;

	// Create a reference to the chat container
	let chatContainer: HTMLElement;

	// Scroll to bottom when component is mounted
	onMount(() => {
		scrollToBottom();
	});

	// Function to scroll to the bottom of the chat
	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}
</script>

<div bind:this={chatContainer} class="flex-1 overflow-y-auto p-2 space-y-3 chat-scrollbar">
	{#each messages as message (message.id)}
		<MessageBubble text={message.text} sender={message.sender} metadata={message.metadata} />
	{/each}

	{#if isTyping}
		<TypingIndicator />
	{/if}
</div>

<style>
	/* Custom scrollbar styling */
	.chat-scrollbar::-webkit-scrollbar {
		width: 6px; /* Thin scrollbar */
	}

	.chat-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.chat-scrollbar::-webkit-scrollbar-thumb {
		background-color: var(--color-him-border); /* Using the him-border color */
		border-radius: 10px; /* Very rounded corners */
	}

	/* For Firefox */
	.chat-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: var(--color-him-border) transparent;
	}
</style>
