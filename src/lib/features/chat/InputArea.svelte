<script lang="ts">
	export const prerender = true;

	let { value = $bindable(''), disabled = false, onsend } = $props();

	function handleSend() {
		if (value.trim() && !disabled) {
			onsend?.(value);
			value = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSend();
		}
	}
</script>

<div class="p-2">
	<div class="flex">
		<input
			type="text"
			bind:value
			{disabled}
			class="flex-1 bg-user-bg/50 text-user-text p-2 rounded-l-md focus:outline-none border border-user-border/60 placeholder:text-user-text/70 text-sm"
			onkeydown={handleKeydown}
			placeholder="Type a message..."
		/>
		<button
			class="bg-user-bg/50 text-user-text p-2 rounded-r-md border border-l-0 border-user-border/60"
			onclick={handleSend}
			{disabled}
			aria-label="Send message"
		>
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

<style>
	/* Custom input styling with glow effect */
	input:focus {
		outline: none;
		box-shadow:
			0 0 8px hsla(var(--primary), 0.7),
			0 0 12px hsla(var(--primary), 0.5);
		border-color: hsla(var(--primary-foreground), 0.6);
	}

	/* Glow effect for placeholder */
	input::placeholder {
		text-shadow:
			0 0 5px hsla(var(--primary), 0.4),
			0 0 8px hsla(var(--primary), 0.3);
	}

	/* Styles for disabled state */
	input:disabled,
	button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
