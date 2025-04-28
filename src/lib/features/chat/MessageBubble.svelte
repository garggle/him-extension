<script lang="ts">
	export const prerender = true;

	const {
		text,
		sender,
		metadata = undefined
	} = $props<{
		text: string;
		sender: 'self' | 'other' | 'system';
		metadata?: {
			buys?: number;
			sells?: number;
			value?: string;
		};
	}>();

	// State to track if message has been hovered
	let hasBeenRead = $state(false);

	// Check if message is an analysis message
	const isAnalysis = $derived(text.includes('Analysis for'));
	const isDepositAnalysis = $derived(text.includes('Analysis for Deposit'));

	// Process the message text to replace placeholders with highlighted values
	const processedText = $derived(
		text
			.replace(
				/{value}/g,
				metadata?.value
					? `<span class="text-primary text-yellow-400 font-semibold">${metadata.value}</span>`
					: ''
			)
			.replace(
				/{buys}/g,
				metadata?.buys !== undefined
					? `<span class="text-green-400 font-semibold">${metadata.buys}</span>`
					: ''
			)
			.replace(
				/{sells}/g,
				metadata?.sells !== undefined
					? `<span class="text-red-400 font-semibold">${metadata.sells}</span>`
					: ''
			)
	);

	// Handle hover event
	function handleFirstHover() {
		if (!hasBeenRead) {
			hasBeenRead = true;
		}
	}
</script>

<div
	class={`p-2 max-w-[90%] border transition-colors duration-300 ease-in-out ${
		sender === 'self'
			? 'ml-auto bg-user-bg/50 text-user-text border-user-border/60 rounded-tl-md rounded-bl-md rounded-br-md'
			: sender === 'other'
				? hasBeenRead
					? isDepositAnalysis
						? 'mr-auto bg-red-900/20 text-red-200 border-red-700/60 rounded-tr-md rounded-bl-md rounded-br-md'
						: isAnalysis
							? 'mr-auto bg-purple-900/20 text-purple-200 border-purple-700/60 rounded-tr-md rounded-bl-md rounded-br-md'
							: 'mr-auto bg-him-bg/10 text-him-text border-him-border/60 rounded-tr-md rounded-bl-md rounded-br-md'
					: 'mr-auto bg-him-text text-slate-800 border-him-text/80 rounded-tr-md rounded-bl-md rounded-br-md inverted-message'
				: 'mr-auto bg-fuchsia-800/30 text-fuchsia-200 border-fuchsia-500/60 rounded-tr-md rounded-bl-md rounded-br-md'
	}`}
	on:mouseenter={handleFirstHover}
>
	<p class="text-sm">
		{@html processedText}
	</p>
</div>

<style>
	/* Optional: Add a subtle animation for the color change */
	.inverted-message {
		box-shadow: 0 0 5px rgba(238, 210, 255, 0.3);
	}

	/* Ensure the transition feels smooth */
	div {
		transition:
			background-color 0.3s ease,
			color 0.3s ease,
			border-color 0.3s ease;
	}
</style>
