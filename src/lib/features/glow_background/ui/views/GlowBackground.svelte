<script lang="ts">
	export const prerender = true;

	import { MOBILE_BREAKPOINT } from '$lib/shared/constants/glow-constants.js';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { NebulaCloud } from '../../entities/nebula-cloud.js';
	import type { StarParticle } from '../../entities/star-particle.js';
	import { drawGlowingStar, drawNebulaCloud } from '../../services/glow-renderer.js';
	import { GlowSimulation } from '../../services/glow-simulation.js';

	// Component state
	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationFrameId: number;
	let resizeListener: () => void;
	let dominantNebulaHSL: string | null = null;

	// Simulation instance
	let simulation: GlowSimulation | null = null;

	onMount(() => {
		// Guard against server-side rendering
		if (typeof window === 'undefined') return;

		// Get canvas context
		ctx = canvasElement.getContext('2d', { alpha: true });
		if (!ctx) return;

		// Setup canvas dimensions
		const setCanvasDimensions = () => {
			canvasElement.width = window.innerWidth;
			canvasElement.height = window.innerHeight;

			// Update simulation dimensions if it exists
			if (simulation) {
				simulation.updateDimensions(
					canvasElement.width,
					canvasElement.height,
					canvasElement.width < MOBILE_BREAKPOINT
				);
				// Reinitialize entities on significant size change (optional, could lead to visual "reset")
				// simulation.initializeEntities();

				// Update dominant color
				dominantNebulaHSL = simulation.getDominantColorHSL();
			}
		};

		setCanvasDimensions();
		resizeListener = setCanvasDimensions;
		window.addEventListener('resize', resizeListener);

		// Detect if we're on a mobile device
		const isMobile = canvasElement.width < MOBILE_BREAKPOINT;

		// Initialize simulation
		simulation = new GlowSimulation(canvasElement.width, canvasElement.height, isMobile);
		simulation.initializeEntities();

		// Get initial dominant color
		dominantNebulaHSL = simulation.getDominantColorHSL();

		let lastTime = 0;

		// Animation loop
		const animate = (time: number) => {
			if (!ctx || !simulation) return;

			// Calculate delta time
			const deltaTime = time - lastTime;
			lastTime = time;

			// Clear canvas
			ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

			// Update simulation
			simulation.update(deltaTime);

			// Get sorted entities to render
			const entities = simulation.getEntitiesToRender();

			// Draw all entities in depth order
			entities.forEach((entity) => {
				if (entity.type === 'cloud') {
					drawNebulaCloud(entity as NebulaCloud, ctx!);
				} else {
					// It's a star particle
					const star = entity as StarParticle;
					drawGlowingStar(
						ctx!,
						star.x,
						star.y,
						star.size * (star.depth * 0.7 + 0.3), // Scale by depth somewhat
						star.twinkleFactor,
						star.coreColor,
						star.midColor,
						star.outerColor,
						star.alpha * (star.depth * 0.5 + 0.5) // Alpha also affected by depth
					);
				}
			});

			animationFrameId = requestAnimationFrame(animate);
		};

		// Start the animation
		animationFrameId = requestAnimationFrame(animate);

		// Cleanup function returned from onMount
		return () => {
			cancelAnimationFrame(animationFrameId);
			window.removeEventListener('resize', resizeListener);
		};
	});

	// Update CSS variables when dominant color changes
	$: if (dominantNebulaHSL && typeof document !== 'undefined') {
		// Parse HSL values
		const [h, s, l] = dominantNebulaHSL.split(' ').map((v) => parseInt(v));

		// Set the primary color variables
		document.documentElement.style.setProperty('--primary', dominantNebulaHSL);
		document.documentElement.style.setProperty('--primary-hue', h.toString());
		document.documentElement.style.setProperty('--primary-saturation', s + '%');

		// Set foreground with high lightness
		const foregroundHSL = `${h} ${s}% 99%`;
		document.documentElement.style.setProperty('--foreground', foregroundHSL);
		document.documentElement.style.setProperty('--primary-foreground', foregroundHSL);
	}
</script>

<canvas
	bind:this={canvasElement}
	class="fixed inset-0 -z-0 pointer-events-none"
	in:fade={{ duration: 500 }}
></canvas>
