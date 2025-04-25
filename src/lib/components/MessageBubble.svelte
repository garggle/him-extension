<script lang="ts">
	export let text: string;
	export let sender: 'self' | 'other' | 'system';
	export let metadata:
		| {
				buys?: number;
				sells?: number;
				value?: string;
		  }
		| undefined = undefined;

	// Process the message text to replace placeholders with highlighted values
	$: processedText = text
		.replace(
			/{value}/g,
			metadata?.value ? `<span class="text-primary font-semibold">${metadata.value}</span>` : ''
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
		);
</script>

<div
	class={`rounded-md p-2 max-w-[90%] border ${
		sender === 'self'
			? 'ml-auto bg-user-bg/50 text-user-text border-user-border/60'
			: 'mr-auto bg-him-bg/10 text-him-text border-him-border/60'
	}`}
>
	<p class="text-sm font-mono">
		{@html processedText}
	</p>
</div>
