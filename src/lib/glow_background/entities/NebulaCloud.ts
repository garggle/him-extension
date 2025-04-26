import type { NebulaCloudCore } from './NebulaCloudCore.js';

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
	type: 'cloud';
}

export type { NebulaCloud };
