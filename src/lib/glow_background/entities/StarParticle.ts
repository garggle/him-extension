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
	// Colors for the star layers
	coreColor: string;
	midColor: string;
	outerColor: string;
	// Twinkling effect
	twinkleFactor: number;
	twinkleDirection: number;
	twinkleSpeed: number;
	twinkleMax: number;
	type: 'star';
}

export type { StarParticle };
