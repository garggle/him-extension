<script lang="ts">
	import { onMount } from 'svelte';

	// Define interfaces for nebula and star components
	interface NebulaCloudCore {
		offsetX: number;
		offsetY: number;
		radius: number;
		colorStops: Array<{ offset: number; color: string }>;
		alphaMultiplier: number;
	}

	interface NebulaCloud {
		x: number;
		y: number;
		vx: number;
		vy: number;
		targetVx: number;
		targetVy: number;
		cores: NebulaCloudCore[];
		depth: number;
		directionChangeTime: number;
		directionChangeInterval: number;
		easeAmount: number;
		paletteIndex: number;
		totalRadius: number;
	}

	interface StarParticle {
		x: number;
		y: number;
		size: number;
		vx: number;
		vy: number;
		targetVx: number;
		targetVy: number;
		alpha: number;
		directionChangeTime: number;
		directionChangeInterval: number;
		depth: number;
		coreColor: string;
		midColor: string;
		outerColor: string;
		twinkleFactor: number;
		twinkleDirection: number;
		twinkleSpeed: number;
		twinkleMax: number;
	}

	// Helper function for easing animations
	const easeInOut = (t: number): number => {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	};

	// Helper function to calculate distance between two points
	const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
	};

	// Helper function to check if a new cloud would overlap with existing clouds
	const wouldOverlap = (
		x: number,
		y: number,
		totalRadius: number,
		existingClouds: Array<{ x: number; y: number; totalRadius: number }>
	): boolean => {
		// Minimum distance multiplier - higher values create more spacing between clouds
		const minDistanceMultiplier = 0.7;

		for (const cloud of existingClouds) {
			const distance = calculateDistance(x, y, cloud.x, cloud.y);
			const minDistance = (totalRadius + cloud.totalRadius) * minDistanceMultiplier;

			if (distance < minDistance) {
				return true; // Would overlap
			}
		}

		return false; // No overlap
	};

	// Draw star with multi-layered glow
	const drawGlowingStar = (
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		size: number,
		twinkleFactor: number,
		coreColor: string,
		midColor: string,
		outerColor: string,
		overallAlpha: number = 1.0
	) => {
		// Skip rendering stars that are too small to be visible
		if (size < 0.3) return;

		ctx.save();

		// Apply global alpha for overall star brightness
		ctx.globalAlpha = overallAlpha;

		// Apply global composite operation for better blending
		ctx.globalCompositeOperation = 'screen';

		// Combined outer and middle glow into one layer
		const outerSize = size * 4 * (1 + twinkleFactor * 0.4);
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, outerSize);

		// Core (brightest part)
		gradient.addColorStop(0, '#FFFFFF');
		gradient.addColorStop(0.1, coreColor);

		// Mid glow
		gradient.addColorStop(0.2, midColor + '90');
		gradient.addColorStop(0.5, midColor + '40');

		// Outer glow
		gradient.addColorStop(0.7, outerColor + '20');
		gradient.addColorStop(1, outerColor + '00');

		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(x, y, outerSize, 0, Math.PI * 2);
		ctx.fill();

		ctx.restore();
	};

	// Draw nebula cloud
	const drawNebulaCloud = (cloud: NebulaCloud, ctx: CanvasRenderingContext2D) => {
		ctx.save();
		ctx.globalCompositeOperation = 'screen';

		for (const core of cloud.cores) {
			const x = cloud.x + core.offsetX;
			const y = cloud.y + core.offsetY;

			const gradient = ctx.createRadialGradient(x, y, 0, x, y, core.radius);

			for (const stop of core.colorStops) {
				gradient.addColorStop(stop.offset, stop.color);
			}

			ctx.globalAlpha = core.alphaMultiplier;
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(x, y, core.radius, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.restore();
	};

	let canvasElement: HTMLCanvasElement;

	onMount(() => {
		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		// Resize canvas to match window
		const resizeCanvas = () => {
			canvasElement.width = window.innerWidth;
			canvasElement.height = window.innerHeight;
		};

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// Detect if we're on a mobile device
		const MOBILE_BREAKPOINT = 768;
		const isMobile = canvasElement.width < MOBILE_BREAKPOINT;

		// Star color palettes matching the theme
		const starPalettes = [
			// Each palette has core, middle, and outer glow colors
			{
				core: '#ffd6f6',
				mid: '#DD459C',
				outer: '#7945A5'
			},
			{
				core: '#E8A3C4',
				mid: '#B768A2',
				outer: '#7945A5'
			},
			{
				core: '#ffd6f6',
				mid: '#9370DB',
				outer: '#7945A5'
			},
			{
				core: '#E0B0FF',
				mid: '#8A2BE2',
				outer: '#7945A5'
			}
		];

		// Nebula color palette definitions
		const nebulaPalettes = [
			// Hydrogen Alpha (red/pink)
			[
				{ offset: 0, color: '#FFA0A060' },
				{ offset: 0.4, color: '#C0404030' },
				{ offset: 1, color: '#80000000' }
			],
			// Mixed (purple/violet)
			[
				{ offset: 0, color: '#D0A0F050' },
				{ offset: 0.5, color: '#8040C020' },
				{ offset: 1, color: '#40008000' }
			],
			// Pink/magenta
			[
				{ offset: 0, color: '#FF80E050' },
				{ offset: 0.5, color: '#D040A020' },
				{ offset: 1, color: '#80004000' }
			]
		];

		// Create nebula clouds
		const nebulaCloudCount = Math.min(
			4,
			Math.max(2, Math.floor((canvasElement.width * canvasElement.height) / 800000))
		);

		const nebulaClouds: NebulaCloud[] = [];
		const placedClouds: Array<{ x: number; y: number; totalRadius: number }> = [];

		// Try to place each cloud without overlaps
		for (let i = 0; i < nebulaCloudCount; i++) {
			let attempts = 0;
			let cloud: NebulaCloud | null = null;

			// Try up to 20 times to place a cloud without overlap
			while (attempts < 20 && cloud === null) {
				attempts++;

				// Generate positions more centered in the canvas
				const x = canvasElement.width * (0.2 + Math.random() * 0.6);
				const y = canvasElement.height * (0.2 + Math.random() * 0.6);
				const depth = 0.5 + Math.random();
				const coreCount = 2 + Math.floor(Math.random() * 3);
				const baseCoreRadius = isMobile ? 150 + Math.random() * 150 : 250 + Math.random() * 200;

				// Choose palette index
				const paletteIndex = Math.floor(Math.random() * nebulaPalettes.length);
				const palette = nebulaPalettes[paletteIndex];

				let totalRadius = 0;
				let maxDistanceFromCenter = 0;

				const cores: NebulaCloudCore[] = Array.from({ length: coreCount }, (_, index) => {
					const radius = baseCoreRadius * (0.8 + Math.random() * 0.6);

					// More structured pseudorandom placement using index
					const angle = (index / coreCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
					const distance = baseCoreRadius * (0.2 + Math.random() * 0.3);

					// Track the maximum distance from center plus core radius
					const distanceFromCenter = Math.sqrt(
						Math.pow(Math.cos(angle) * distance, 2) + Math.pow(Math.sin(angle) * distance, 2)
					);
					maxDistanceFromCenter = Math.max(maxDistanceFromCenter, distanceFromCenter + radius);

					return {
						offsetX: Math.cos(angle) * distance,
						offsetY: Math.sin(angle) * distance,
						radius,
						colorStops: [...palette],
						alphaMultiplier: 0.4 + Math.random() * 0.4
					};
				});

				// Use the maximum distance from center plus radius as the total radius
				totalRadius = maxDistanceFromCenter;

				// Check if this cloud would overlap with existing clouds
				if (!wouldOverlap(x, y, totalRadius, placedClouds)) {
					cloud = {
						x,
						y,
						vx: (Math.random() - 0.5) * 0.15,
						vy: (Math.random() - 0.5) * 0.15,
						targetVx: (Math.random() - 0.5) * 0.3,
						targetVy: (Math.random() - 0.5) * 0.3,
						cores,
						depth,
						directionChangeTime: Math.random() * 6000,
						directionChangeInterval: 4000 + Math.random() * 6000,
						easeAmount: 0,
						paletteIndex,
						totalRadius
					};

					// Add to placed clouds for future overlap checking
					placedClouds.push({ x, y, totalRadius });
				}
			}

			if (cloud) {
				nebulaClouds.push(cloud);
			}
		}

		// Create stars
		const starCount = isMobile ? 50 : 100;
		const stars: StarParticle[] = Array.from({ length: starCount }, () => {
			const paletteIndex = Math.floor(Math.random() * starPalettes.length);
			const { core, mid, outer } = starPalettes[paletteIndex];

			const depth = 0.2 + Math.random() * 0.8;
			const baseSize = 1 + Math.random() * 1.5;
			// Scale size based on depth (further stars are smaller)
			const size = baseSize * depth;

			return {
				x: Math.random() * canvasElement.width,
				y: Math.random() * canvasElement.height,
				size,
				vx: (Math.random() - 0.5) * 0.1,
				vy: (Math.random() - 0.5) * 0.1,
				targetVx: (Math.random() - 0.5) * 0.2,
				targetVy: (Math.random() - 0.5) * 0.2,
				alpha: 0.5 + Math.random() * 0.5,
				directionChangeTime: Math.random() * 6000,
				directionChangeInterval: 6000 + Math.random() * 8000,
				depth,
				coreColor: core,
				midColor: mid,
				outerColor: outer,
				twinkleFactor: Math.random() * 0.5,
				twinkleDirection: Math.random() > 0.5 ? 1 : -1,
				twinkleSpeed: 0.002 + Math.random() * 0.004,
				twinkleMax: 0.6 + Math.random() * 0.4
			};
		});

		// Animation variables
		let lastTime = 0;

		function animate(time: number) {
			ctx!.clearRect(0, 0, canvasElement.width, canvasElement.height);

			const deltaTime = lastTime ? time - lastTime : 0;
			lastTime = time;

			// Update and draw nebula clouds
			for (const cloud of nebulaClouds) {
				// Update direction change timer
				cloud.directionChangeTime += deltaTime;
				if (cloud.directionChangeTime > cloud.directionChangeInterval) {
					cloud.directionChangeTime = 0;
					cloud.targetVx = (Math.random() - 0.5) * 0.3;
					cloud.targetVy = (Math.random() - 0.5) * 0.3;
					cloud.easeAmount = 0;
				}

				// Ease towards target velocity
				cloud.easeAmount = Math.min(1, cloud.easeAmount + deltaTime / 5000);
				const easeValue = easeInOut(cloud.easeAmount);
				cloud.vx = cloud.vx + (cloud.targetVx - cloud.vx) * easeValue * 0.05;
				cloud.vy = cloud.vy + (cloud.targetVy - cloud.vy) * easeValue * 0.05;

				// Update position
				cloud.x += cloud.vx * deltaTime * 0.01;
				cloud.y += cloud.vy * deltaTime * 0.01;

				// Wrap around canvas edges with buffer
				const buffer = cloud.totalRadius;
				if (cloud.x < -buffer) cloud.x = canvasElement.width + buffer;
				if (cloud.x > canvasElement.width + buffer) cloud.x = -buffer;
				if (cloud.y < -buffer) cloud.y = canvasElement.height + buffer;
				if (cloud.y > canvasElement.height + buffer) cloud.y = -buffer;

				// Draw the cloud
				drawNebulaCloud(cloud, ctx!);
			}

			// Update and draw stars
			for (const star of stars) {
				// Update direction change timer
				star.directionChangeTime += deltaTime;
				if (star.directionChangeTime > star.directionChangeInterval) {
					star.directionChangeTime = 0;
					star.targetVx = (Math.random() - 0.5) * 0.2;
					star.targetVy = (Math.random() - 0.5) * 0.2;
				}

				// Update velocity
				star.vx = star.vx + (star.targetVx - star.vx) * 0.01;
				star.vy = star.vy + (star.targetVy - star.vy) * 0.01;

				// Update position
				star.x += star.vx * deltaTime * 0.01;
				star.y += star.vy * deltaTime * 0.01;

				// Update twinkling
				star.twinkleFactor += star.twinkleDirection * star.twinkleSpeed * deltaTime;
				if (star.twinkleFactor > star.twinkleMax || star.twinkleFactor < 0) {
					star.twinkleDirection *= -1;
				}

				// Wrap around canvas edges
				if (star.x < 0) star.x = canvasElement.width;
				if (star.x > canvasElement.width) star.x = 0;
				if (star.y < 0) star.y = canvasElement.height;
				if (star.y > canvasElement.height) star.y = 0;

				// Draw the star
				drawGlowingStar(
					ctx!,
					star.x,
					star.y,
					star.size,
					star.twinkleFactor,
					star.coreColor,
					star.midColor,
					star.outerColor,
					star.alpha
				);
			}

			requestAnimationFrame(animate);
		}

		animate(0);

		// Clean up event listener on component unmount
		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	});
</script>

<canvas bind:this={canvasElement} class="fixed inset-0 -z-10"></canvas>
