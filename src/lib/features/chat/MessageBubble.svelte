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
	const isAction = $derived(text.includes('action:') || text.includes('Action:'));

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
			.replace(/\n/g, '<br />') // Convert newlines to <br> tags
	);

	// Handle hover event
	function handleFirstHover() {
		if (!hasBeenRead) {
			hasBeenRead = true;
		}
	}

	// Determine the glow color based on message type
	const glowColor = $derived(() => {
		if (isAction) return 'rgba(236, 72, 153, 0.9)'; // Pink for action
		if (isDepositAnalysis) return 'rgba(248, 113, 113, 0.9)'; // Red for deposit analysis
		if (isAnalysis) return 'rgba(216, 180, 254, 0.9)'; // Purple for analysis
		return 'rgba(238, 210, 255, 0.9)'; // Default for other messages
	});
</script>

<div
	class={`p-2 max-w-[90%] border transition-all duration-300 ease-in-out ${
		sender === 'self'
			? 'ml-auto bg-user-bg/50 text-user-text border-user-border/60 rounded-tl-md rounded-bl-md rounded-br-md'
			: sender === 'other'
				? 'mr-auto rounded-tr-md rounded-bl-md rounded-br-md ' +
					(hasBeenRead
						? isAction
							? 'bg-pink-900/20 text-pink-200 border-pink-700/60'
							: isDepositAnalysis
								? 'bg-red-900/20 text-red-200 border-red-700/60'
								: isAnalysis
									? 'bg-purple-900/20 text-purple-200 border-purple-700/60'
									: 'bg-him-bg/10 text-him-text border-him-border/60'
						: isAction
							? 'bg-pink-900/30 text-pink-100 border-pink-500 glow-message shadow-lg shadow-pink-500/50'
							: isDepositAnalysis
								? 'bg-red-900/30 text-red-100 border-red-500 glow-message shadow-lg shadow-red-500/50'
								: isAnalysis
									? 'bg-purple-900/30 text-purple-100 border-purple-500 glow-message shadow-lg shadow-purple-500/50'
									: 'bg-him-bg/20 text-him-text border-him-border glow-message shadow-lg shadow-purple-300/50')
				: 'mr-auto bg-fuchsia-800/30 text-fuchsia-200 border-fuchsia-500/60 rounded-tr-md rounded-bl-md rounded-br-md'
	}`}
	on:mouseenter={handleFirstHover}
	style={!hasBeenRead && sender === 'other' ? `--glow-color: ${glowColor}` : ''}
>
	<p class="text-sm">
		{@html processedText}
	</p>
</div>

<style>
	/* Make unread messages glow */
	.glow-message {
		box-shadow:
			0 0 15px 5px var(--glow-color, rgba(238, 210, 255, 0.9)),
			0 0 30px 10px var(--glow-color, rgba(238, 210, 255, 0.5));
		animation: pulse 1.5s infinite;
	}

	/* Pulse animation for the glow effect */
	@keyframes pulse {
		0% {
			box-shadow:
				0 0 15px 5px var(--glow-color, rgba(238, 210, 255, 0.9)),
				0 0 25px 8px var(--glow-color, rgba(238, 210, 255, 0.5));
		}
		50% {
			box-shadow:
				0 0 20px 8px var(--glow-color, rgba(238, 210, 255, 0.9)),
				0 0 40px 15px var(--glow-color, rgba(238, 210, 255, 0.5));
		}
		100% {
			box-shadow:
				0 0 15px 5px var(--glow-color, rgba(238, 210, 255, 0.9)),
				0 0 25px 8px var(--glow-color, rgba(238, 210, 255, 0.5));
		}
	}

	/* Ensure the transition feels smooth */
	div {
		transition:
			background-color 0.3s ease,
			color 0.3s ease,
			border-color 0.3s ease,
			box-shadow 0.3s ease;
	}
</style>
