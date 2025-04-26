import { nebulaPalettes } from '$lib/shared/constants/GlowConstants.js';
import { easeInOut } from '$lib/shared/utils/AnimationUtils.js';
import { calculateDistance } from '$lib/shared/utils/GeometryUtils.js';
import { CloudConfig } from '../config/CloudConfig.js';
import { SimulationConfig } from '../config/SimulationConfig.js';
import type { NebulaCloud } from '../entities/NebulaCloud.js';
import type { NebulaCloudCore } from '../entities/NebulaCloudCore.js';

export class NebulaCloudManager {
	private nebulaClouds: NebulaCloud[] = [];
	private placedClouds: Array<{ x: number; y: number; totalRadius: number }> = [];
	private width: number;
	private height: number;
	private isMobile: boolean;

	constructor(width: number, height: number, isMobile: boolean) {
		this.width = width;
		this.height = height;
		this.isMobile = isMobile || width < SimulationConfig.MOBILE_WIDTH_THRESHOLD;
	}

	/**
	 * Updates the manager dimensions, typically called after a resize event
	 */
	public updateDimensions(width: number, height: number, isMobile: boolean): void {
		this.width = width;
		this.height = height;
		this.isMobile = isMobile || width < SimulationConfig.MOBILE_WIDTH_THRESHOLD;
	}

	/**
	 * Initialize all nebula clouds
	 */
	public initialize(): void {
		// Clear existing clouds
		this.nebulaClouds = [];
		this.placedClouds = [];

		this._initializeNebulaClouds();
	}

	/**
	 * Update all nebula clouds
	 */
	public update(deltaTime: number): void {
		this.nebulaClouds.forEach((cloud) => this._updateNebulaCloud(cloud, deltaTime));
	}

	/**
	 * Get all nebula clouds
	 */
	public getClouds(): NebulaCloud[] {
		return this.nebulaClouds;
	}

	/**
	 * Calculate the dominant color from the clouds
	 */
	public getColorWeights(): { paletteIndex: number; weight: number }[] {
		const paletteWeights = new Array(nebulaPalettes.length).fill(0);

		// Weight each palette by the total radius of clouds using it
		this.nebulaClouds.forEach((cloud) => {
			paletteWeights[cloud.paletteIndex] += cloud.totalRadius * cloud.depth;
		});

		return paletteWeights.map((weight, paletteIndex) => ({ paletteIndex, weight }));
	}

	/**
	 * Create and initialize nebula clouds
	 */
	private _initializeNebulaClouds(): void {
		// Calculate cloud count based on screen size
		const nebulaCloudCount = Math.min(
			CloudConfig.MAX_CLOUD_COUNT,
			Math.max(
				CloudConfig.MIN_CLOUD_COUNT,
				Math.floor((this.width * this.height) / CloudConfig.AREA_PER_CLOUD)
			)
		);

		// Try to place each cloud without overlaps
		for (let i = 0; i < nebulaCloudCount; i++) {
			const cloud = this._createNebulaCloud();
			if (cloud) {
				this.nebulaClouds.push(cloud);
			}
		}
	}

	/**
	 * Create a single nebula cloud, attempting placement without overlap
	 */
	private _createNebulaCloud(): NebulaCloud | null {
		let attempts = 0;
		let cloud: NebulaCloud | null = null;

		// Try up to max attempts to place a cloud without overlap
		while (attempts < CloudConfig.PLACEMENT_MAX_ATTEMPTS && cloud === null) {
			attempts++;

			// Generate positions more centered in the canvas
			const x =
				this.width *
				(CloudConfig.POSITION_MIN_PERCENT +
					Math.random() * (CloudConfig.POSITION_MAX_PERCENT - CloudConfig.POSITION_MIN_PERCENT));
			const y =
				this.height *
				(CloudConfig.POSITION_MIN_PERCENT +
					Math.random() * (CloudConfig.POSITION_MAX_PERCENT - CloudConfig.POSITION_MIN_PERCENT));
			const depth =
				CloudConfig.MIN_DEPTH + Math.random() * (CloudConfig.MAX_DEPTH - CloudConfig.MIN_DEPTH);
			const coreCount =
				CloudConfig.MIN_CLOUD_CORES +
				Math.floor(Math.random() * (CloudConfig.MAX_CLOUD_CORES - CloudConfig.MIN_CLOUD_CORES + 1));

			const baseCoreRadius = this._getBaseCoreRadius();

			// Choose palette index
			const paletteIndex = Math.floor(Math.random() * nebulaPalettes.length);
			const palette = nebulaPalettes[paletteIndex];

			const { cores, totalRadius } = this._createNebulaCores(coreCount, baseCoreRadius, palette);

			// Check if this cloud would overlap with existing clouds
			if (!this._wouldOverlap(x, y, totalRadius, this.placedClouds)) {
				cloud = {
					x,
					y,
					vx: (Math.random() - 0.5) * CloudConfig.VELOCITY_FACTOR,
					vy: (Math.random() - 0.5) * CloudConfig.VELOCITY_FACTOR,
					targetVx: (Math.random() - 0.5) * CloudConfig.TARGET_VELOCITY_FACTOR,
					targetVy: (Math.random() - 0.5) * CloudConfig.TARGET_VELOCITY_FACTOR,
					cores,
					depth,
					directionChangeTime: Math.random() * CloudConfig.MAX_DIRECTION_CHANGE,
					directionChangeInterval:
						CloudConfig.MIN_DIRECTION_CHANGE +
						Math.random() * (CloudConfig.MAX_DIRECTION_CHANGE - CloudConfig.MIN_DIRECTION_CHANGE),
					easeAmount: 0,
					paletteIndex,
					totalRadius,
					type: 'cloud'
				};

				// Add to placed clouds for future overlap checking
				this.placedClouds.push({ x, y, totalRadius });
			}
		}

		// If we couldn't place a cloud after max attempts, create one anyway at a random position
		if (!cloud) {
			cloud = this._createFallbackNebulaCloud();
		}

		return cloud;
	}

	/**
	 * Create nebula cloud cores and calculate total radius
	 */
	private _createNebulaCores(
		coreCount: number,
		baseCoreRadius: number,
		palette: any[]
	): { cores: NebulaCloudCore[]; totalRadius: number } {
		let maxDistanceFromCenter = 0;

		const cores: NebulaCloudCore[] = Array.from({ length: coreCount }, (_, index) => {
			// Increase minimum radius factor
			const radius =
				baseCoreRadius *
				(CloudConfig.CORE_RADIUS_MIN +
					Math.random() * (CloudConfig.CORE_RADIUS_MAX - CloudConfig.CORE_RADIUS_MIN));

			// More structured pseudorandom placement using index
			// Divide the circle into sections based on core count
			const angle = (index / coreCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
			const distance =
				baseCoreRadius *
				(CloudConfig.CORE_DISTANCE_MIN +
					Math.random() * (CloudConfig.CORE_DISTANCE_MAX - CloudConfig.CORE_DISTANCE_MIN));

			// Track the maximum distance from center plus core radius
			const distanceFromCenter = Math.sqrt(
				Math.pow(Math.cos(angle) * distance, 2) + Math.pow(Math.sin(angle) * distance, 2)
			);
			maxDistanceFromCenter = Math.max(maxDistanceFromCenter, distanceFromCenter + radius);

			return {
				// Use angle-based positioning for more even distribution
				offsetX: Math.cos(angle) * distance,
				offsetY: Math.sin(angle) * distance,
				radius,
				colorStops: [...palette],
				alphaMultiplier:
					CloudConfig.CORE_MIN_ALPHA +
					Math.random() * (CloudConfig.CORE_MAX_ALPHA - CloudConfig.CORE_MIN_ALPHA)
			};
		});

		// Use the maximum distance from center plus radius as the total radius
		return { cores, totalRadius: maxDistanceFromCenter };
	}

	/**
	 * Create a fallback nebula cloud when placement fails after max attempts
	 */
	private _createFallbackNebulaCloud(): NebulaCloud {
		const x = Math.random() * this.width;
		const y = Math.random() * this.height;
		const depth =
			CloudConfig.MIN_DEPTH + Math.random() * (CloudConfig.MAX_DEPTH - CloudConfig.MIN_DEPTH);
		const coreCount =
			CloudConfig.MIN_CLOUD_CORES +
			Math.floor(Math.random() * (CloudConfig.MAX_CLOUD_CORES - CloudConfig.MIN_CLOUD_CORES + 1));

		const baseCoreRadius = this._getBaseCoreRadius();

		const paletteIndex = Math.floor(Math.random() * nebulaPalettes.length);
		const palette = nebulaPalettes[paletteIndex];

		const { cores } = this._createNebulaCores(coreCount, baseCoreRadius, palette);

		return {
			x,
			y,
			vx: (Math.random() - 0.5) * CloudConfig.VELOCITY_FACTOR,
			vy: (Math.random() - 0.5) * CloudConfig.VELOCITY_FACTOR,
			targetVx: (Math.random() - 0.5) * CloudConfig.TARGET_VELOCITY_FACTOR,
			targetVy: (Math.random() - 0.5) * CloudConfig.TARGET_VELOCITY_FACTOR,
			cores,
			depth,
			directionChangeTime: Math.random() * CloudConfig.MAX_DIRECTION_CHANGE,
			directionChangeInterval:
				CloudConfig.MIN_DIRECTION_CHANGE +
				Math.random() * (CloudConfig.MAX_DIRECTION_CHANGE - CloudConfig.MIN_DIRECTION_CHANGE),
			easeAmount: 0,
			paletteIndex,
			totalRadius: 0, // We don't know the exact radius, so we can't use this for overlap detection
			type: 'cloud'
		};
	}

	/**
	 * Get the base core radius based on screen size
	 */
	private _getBaseCoreRadius(): number {
		return this.width < SimulationConfig.MOBILE_WIDTH_THRESHOLD
			? CloudConfig.MOBILE_CORE_RADIUS_MIN +
					Math.random() * (CloudConfig.MOBILE_CORE_RADIUS_MAX - CloudConfig.MOBILE_CORE_RADIUS_MIN)
			: CloudConfig.DESKTOP_CORE_RADIUS_MIN +
					Math.random() *
						(CloudConfig.DESKTOP_CORE_RADIUS_MAX - CloudConfig.DESKTOP_CORE_RADIUS_MIN);
	}

	/**
	 * Update a single nebula cloud
	 */
	private _updateNebulaCloud(cloud: NebulaCloud, deltaTime: number): void {
		// Update direction change timer
		cloud.directionChangeTime += deltaTime;

		if (cloud.directionChangeTime > cloud.directionChangeInterval) {
			cloud.directionChangeTime = 0;
			cloud.directionChangeInterval =
				CloudConfig.MIN_DIRECTION_CHANGE +
				Math.random() * (CloudConfig.MAX_DIRECTION_CHANGE - CloudConfig.MIN_DIRECTION_CHANGE);

			// Set new target velocities
			cloud.targetVx = (Math.random() - 0.5) * CloudConfig.TARGET_VELOCITY_FACTOR;
			cloud.targetVy = (Math.random() - 0.5) * CloudConfig.TARGET_VELOCITY_FACTOR;

			// Reset easing animation
			cloud.easeAmount = 0;
		}

		// Progress the ease amount
		cloud.easeAmount = Math.min(1, cloud.easeAmount + deltaTime / CloudConfig.EASING_DIVISOR);

		// Apply easing to velocity changes
		const easeValue = easeInOut(cloud.easeAmount);
		cloud.vx += (cloud.targetVx - cloud.vx) * easeValue * CloudConfig.EASING_FACTOR;
		cloud.vy += (cloud.targetVy - cloud.vy) * easeValue * CloudConfig.EASING_FACTOR;

		// Move cloud
		cloud.x += cloud.vx * deltaTime * CloudConfig.MOVEMENT_SPEED;
		cloud.y += cloud.vy * deltaTime * CloudConfig.MOVEMENT_SPEED;

		// Wrap at screen edges
		this._wrapNebulaCloudAtEdges(cloud);
	}

	/**
	 * Wrap nebula cloud at screen edges
	 */
	private _wrapNebulaCloudAtEdges(cloud: NebulaCloud): void {
		const maxRadius = Math.max(...cloud.cores.map((c) => c.radius));

		if (cloud.x < -maxRadius * CloudConfig.WRAP_FACTOR) {
			cloud.x = this.width + maxRadius * CloudConfig.REENTRY_FACTOR;
		}

		if (cloud.x > this.width + maxRadius * CloudConfig.WRAP_FACTOR) {
			cloud.x = -maxRadius * CloudConfig.REENTRY_FACTOR;
		}

		if (cloud.y < -maxRadius * CloudConfig.WRAP_FACTOR) {
			cloud.y = this.height + maxRadius * CloudConfig.REENTRY_FACTOR;
		}

		if (cloud.y > this.height + maxRadius * CloudConfig.WRAP_FACTOR) {
			cloud.y = -maxRadius * CloudConfig.REENTRY_FACTOR;
		}
	}

	/**
	 * Helper function to check if a new cloud would overlap with existing clouds
	 */
	private _wouldOverlap(
		x: number,
		y: number,
		totalRadius: number,
		existingClouds: Array<{ x: number; y: number; totalRadius: number }>
	): boolean {
		for (const cloud of existingClouds) {
			const distance = calculateDistance(x, y, cloud.x, cloud.y);
			const minDistance = (totalRadius + cloud.totalRadius) * CloudConfig.OVERLAP_MULTIPLIER;

			if (distance < minDistance) {
				return true; // Would overlap
			}
		}

		return false; // No overlap
	}
}
