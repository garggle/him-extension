<script lang="ts">
	import GlowBackground from '$lib/components/GlowBackground.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<GlowBackground />

<div class="flex flex-col h-screen bg-black/30 text-white overflow-hidden">
	{@render children()}
</div>
