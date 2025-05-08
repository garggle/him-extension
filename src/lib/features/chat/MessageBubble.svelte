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

	// Check message types based on content
	const isAnalysis = $derived(text.includes('Analysis for'));
	const isDepositAnalysis = $derived(text.includes('Analysis for Deposit'));
	const isAction = $derived(text.includes('action:') || text.includes('Action:'));

	// Check for emoji delimiters at the start of messages
	const isCheckmark = $derived(text.trim().startsWith('✅')); // Strategy/Action message
	const isTestTube = $derived(text.trim().startsWith('✨')); // Liquidity message
	const isPeople = $derived(text.trim().startsWith('👥')); // Holder structure message
	const isWhale = $derived(text.trim().startsWith('🐳')); // Manipulation risk message
	const isWarning = $derived(text.trim().startsWith('🚨') || text.trim().startsWith('⚠️')); // Warning/Final call message

	// Process the message text to replace placeholders with highlighted values
	const processedText = $derived(
		text
			.replace(/\n/g, '<br>') // Replace newlines with double <br> tags
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

	// Determine the glow color based on message type
	const glowColor = $derived(() => {
		if (isCheckmark) return 'rgba(74, 222, 128, 0.9)'; // Green for strategy
		if (isTestTube) return 'rgba(129, 140, 248, 0.9)'; // yellow for liquidity
		if (isPeople) return 'rgba(168, 85, 247, 0.9)'; // Purple for holders
		if (isWhale) return 'rgba(14, 165, 233, 0.9)'; // Sky blue for manipulation risk
		if (isWarning) return 'rgba(251, 146, 60, 0.9)'; // red for warning/final call
		if (isAction) return 'rgba(236, 72, 153, 0.9)'; // Pink for action
		if (isDepositAnalysis) return 'rgba(248, 113, 113, 0.9)'; // Red for deposit analysis
		if (isAnalysis) return 'rgba(216, 180, 254, 0.9)'; // Purple for analysis
		return 'rgba(238, 210, 255, 0.9)'; // Default for other messages
	});

	// Determine style classes based on message type for the unread state
	const unreadClasses = $derived(() => {
		if (isCheckmark)
			return 'bg-green-900/30 text-green-100 border-green-500 glow-message shadow-lg shadow-green-500/50';
		if (isTestTube)
			return 'bg-yellow-900/30 text-yellow-100 border-yellow-500 glow-message shadow-lg shadow-yellow-500/50';
		if (isPeople)
			return 'bg-purple-900/30 text-purple-100 border-purple-500 glow-message shadow-lg shadow-purple-500/50';
		if (isWhale)
			return 'bg-sky-900/30 text-sky-100 border-sky-500 glow-message shadow-lg shadow-sky-500/50';
		if (isWarning)
			return 'bg-red-900/30 text-red-100 border-red-500 glow-message shadow-lg shadow-red-500/50';
		if (isAction)
			return 'bg-pink-900/30 text-pink-100 border-pink-500 glow-message shadow-lg shadow-pink-500/50';
		if (isDepositAnalysis)
			return 'bg-red-900/30 text-red-100 border-red-500 glow-message shadow-lg shadow-red-500/50';
		if (isAnalysis)
			return 'bg-purple-900/30 text-purple-100 border-purple-500 glow-message shadow-lg shadow-purple-500/50';
		return 'bg-him-bg/20 text-him-text border-him-border glow-message shadow-lg shadow-purple-300/50';
	});

	// Determine style classes based on message type for the read state
	const readClasses = $derived(() => {
		if (isCheckmark) return 'bg-green-900/20 text-green-200 border-green-700/60';
		if (isTestTube) return 'bg-yellow-900/20 text-yellow-200 border-yellow-700/60';
		if (isPeople) return 'bg-purple-900/20 text-purple-200 border-purple-700/60';
		if (isWhale) return 'bg-sky-900/20 text-sky-200 border-sky-700/60';
		if (isWarning) return 'bg-red-900/20 text-red-200 border-red-700/60';
		if (isAction) return 'bg-pink-900/20 text-pink-200 border-pink-700/60';
		if (isDepositAnalysis) return 'bg-red-900/20 text-red-200 border-red-700/60';
		if (isAnalysis) return 'bg-purple-900/20 text-purple-200 border-purple-700/60';
		return 'bg-him-bg/10 text-him-text border-him-border/60';
	});
</script>

<div
	class={`p-2 max-w-[90%] border transition-all duration-300 ease-in-out ${
		sender === 'self'
			? 'ml-auto bg-user-bg/50 text-user-text border-user-border/60 rounded-tl-md rounded-bl-md rounded-br-md'
			: sender === 'other'
				? 'mr-auto rounded-tr-md rounded-bl-md rounded-br-md ' +
					(hasBeenRead
						? isCheckmark
							? 'bg-green-900/20 text-green-200 border-green-700/60'
							: isTestTube
								? 'bg-yellow-900/20 text-yellow-200 border-yellow-700/60'
								: isPeople
									? 'bg-purple-900/20 text-purple-200 border-purple-700/60'
									: isWhale
										? 'bg-sky-900/20 text-sky-200 border-sky-700/60'
										: isWarning
											? 'bg-red-900/20 text-red-200 border-red-700/60'
											: isAction
												? 'bg-pink-900/20 text-pink-200 border-pink-700/60'
												: isDepositAnalysis
													? 'bg-red-900/20 text-red-200 border-red-700/60'
													: isAnalysis
														? 'bg-purple-900/20 text-purple-200 border-purple-700/60'
														: 'bg-him-bg/10 text-him-text border-him-border/60'
						: isCheckmark
							? 'bg-green-900/30 text-green-100 border-green-500 glow-message shadow-lg shadow-green-500/50'
							: isTestTube
								? 'bg-yellow-900/30 text-yellow-100 border-yellow-500 glow-message shadow-lg shadow-yellow-500/50'
								: isPeople
									? 'bg-purple-900/30 text-purple-100 border-purple-500 glow-message shadow-lg shadow-purple-500/50'
									: isWhale
										? 'bg-sky-900/30 text-sky-100 border-sky-500 glow-message shadow-lg shadow-sky-500/50'
										: isWarning
											? 'bg-red-900/30 text-red-100 border-red-500 glow-message shadow-lg shadow-red-500/50'
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
		position: relative;
	}
</style>
