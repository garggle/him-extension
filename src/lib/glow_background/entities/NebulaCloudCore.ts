interface NebulaCloudCore {
	offsetX: number;
	offsetY: number;
	radius: number;
	colorStops: Array<{ offset: number; color: string }>;
	alphaMultiplier: number;
}

export type { NebulaCloudCore };
