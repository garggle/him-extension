<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value = '';

	const dispatch = createEventDispatcher<{
		send: string;
	}>();

	function handleSend() {
		if (value.trim()) {
			dispatch('send', value);
			value = '';
		}
	}
</script>

<div class="p-2 border-t border-purple-700/30">
	<div class="flex">
		<input
			type="text"
			bind:value
			placeholder="Type a message..."
			class="flex-1 bg-purple-900/20 text-white p-2 rounded-l-md focus:outline-none border border-purple-700/30"
			on:keydown={(e) => e.key === 'Enter' && handleSend()}
		/>
		<button class="bg-purple-700 text-white p-2 rounded-r-md" on:click={handleSend}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 transform rotate-90"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
				/>
			</svg>
		</button>
	</div>
</div>
