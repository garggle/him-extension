import type { NebulaCloud } from '../entities/nebula-cloud.js';

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

// Function to draw a nebula cloud
const drawNebulaCloud = (cloud: NebulaCloud, ctx: CanvasRenderingContext2D) => {
	ctx.save();

	// Set blend mode for additive blending of cloud colors
	ctx.globalCompositeOperation = 'lighter';

	// Draw each core of the cloud
	cloud.cores.forEach((core) => {
		// Calculate absolute position
		const absX = cloud.x + core.offsetX;
		const absY = cloud.y + core.offsetY;

		// Create gradient from the core's color stops
		const gradient = ctx.createRadialGradient(absX, absY, 0, absX, absY, core.radius * cloud.depth);

		// Apply all color stops
		core.colorStops.forEach((stop) => {
			gradient.addColorStop(stop.offset, stop.color);
		});

		// Set alpha and draw
		ctx.globalAlpha = core.alphaMultiplier;
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(absX, absY, core.radius * cloud.depth, 0, Math.PI * 2);
		ctx.fill();
	});

	ctx.restore();
};

export { drawGlowingStar, drawNebulaCloud };
