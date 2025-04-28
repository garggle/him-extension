<script lang="ts">
	// Animation interval for typing dots
	let dots = $state('');
	let interval: ReturnType<typeof setInterval>;
	let visible = $state(false);

	// Use Svelte 5 effect for lifecycle
	$effect.root(() => {
		// Make it visible after 100ms
		setTimeout(() => {
			visible = true;
		}, 100);

		// Start the animation when component mounts
		interval = setInterval(() => {
			// Cycle through 1-3 dots
			dots = dots.length < 3 ? dots + '.' : '';
		}, 400);

		// Clean up on unmount
		return () => {
			if (interval) clearInterval(interval);
			visible = false; // Reset visibility state on unmount
		};
	});
</script>

{#if visible}
	<div
		class="mr-auto bg-him-bg/10 text-him-text border border-him-border/60 rounded-tr-md rounded-bl-md rounded-br-md p-2 max-w-[50px] my-1"
	>
		<div class="flex items-center space-x-1">
			<div class="w-1.5 h-1.5 bg-him-border animate-pulse" style="border-radius: 1px"></div>
			<div
				class="w-1.5 h-1.5 bg-him-border animate-pulse"
				style="animation-delay: 0.2s; border-radius: 1px"
			></div>
			<div
				class="w-1.5 h-1.5 bg-him-border animate-pulse"
				style="animation-delay: 0.4s; border-radius: 1px"
			></div>
		</div>
	</div>
{/if}

<style>
	@keyframes pulse {
		0%,
		100% {
			transform: scale(0.2);
		}
		50% {
			transform: scale(1);
		}
	}

	.animate-pulse {
		animation: pulse 1.2s ease-in-out infinite;
	}
</style>
