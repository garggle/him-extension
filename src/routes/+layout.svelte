<script lang="ts">
	import GlowBackground from '$lib/features/glow_background/ui/views/GlowBackground.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<GlowBackground />

<div class="flex flex-col h-screen bg-black/30 text-white overflow-hidden relative z-10">
	{@render children()}
</div>
