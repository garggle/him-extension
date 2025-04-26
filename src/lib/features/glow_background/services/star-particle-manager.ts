import { starPalettes } from '$lib/shared/constants/GlowConstants.js';
import { SimulationConfig } from '../config/simulation-config.js';
import { StarConfig } from '../config/star-config.js';
import type { StarParticle } from '../entities/star-particle.js';

export class StarParticleManager {
	private starParticles: StarParticle[] = [];
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
	 * Initialize all star particles
	 */
	public initialize(): void {
		// Clear existing stars
		this.starParticles = [];

		this._initializeStarParticles();
	}

	/**
	 * Update all star particles
	 */
	public update(deltaTime: number): void {
		this.starParticles.forEach((particle) => this._updateStarParticle(particle, deltaTime));
	}

	/**
	 * Get all star particles
	 */
	public getStars(): StarParticle[] {
		return this.starParticles;
	}

	/**
	 * Create and initialize star particles
	 */
	private _initializeStarParticles(): void {
		const particleCount = this.isMobile
			? Math.max(
					StarConfig.MOBILE_BASE_STAR_COUNT,
					Math.floor((this.width * this.height) / StarConfig.MOBILE_AREA_PER_STAR)
				)
			: StarConfig.DESKTOP_STAR_COUNT;

		this.starParticles = Array.from({ length: particleCount }, () => this._createStarParticle());
	}

	/**
	 * Create a single star particle
	 */
	private _createStarParticle(): StarParticle {
		// Get a random color palette
		const palette = starPalettes[Math.floor(Math.random() * starPalettes.length)];
		const size = StarConfig.SIZE_MIN + Math.random() * (StarConfig.SIZE_MAX - StarConfig.SIZE_MIN);

		return {
			x: Math.random() * this.width,
			y: Math.random() * this.height,
			size,
			vx: (Math.random() - 0.5) * StarConfig.VELOCITY_FACTOR,
			vy: (Math.random() - 0.5) * StarConfig.VELOCITY_FACTOR,
			targetVx: (Math.random() - 0.5) * StarConfig.TARGET_VELOCITY_FACTOR,
			targetVy: (Math.random() - 0.5) * StarConfig.TARGET_VELOCITY_FACTOR,
			alpha: StarConfig.ALPHA_MIN + Math.random() * (StarConfig.ALPHA_MAX - StarConfig.ALPHA_MIN),
			directionChangeTime: Math.random() * StarConfig.MIN_DIRECTION_CHANGE,
			directionChangeInterval:
				StarConfig.MIN_DIRECTION_CHANGE +
				Math.random() * (StarConfig.MAX_DIRECTION_CHANGE - StarConfig.MIN_DIRECTION_CHANGE),
			depth: StarConfig.MIN_DEPTH + Math.random() * (StarConfig.MAX_DEPTH - StarConfig.MIN_DEPTH),
			// Colors for the three layers
			coreColor: palette.core,
			midColor: palette.mid,
			outerColor: palette.outer,
			// Twinkling effect
			twinkleFactor: 0,
			twinkleDirection: Math.random() > 0.5 ? 1 : -1,
			twinkleSpeed:
				StarConfig.TWINKLE_SPEED_MIN +
				Math.random() * (StarConfig.TWINKLE_SPEED_MAX - StarConfig.TWINKLE_SPEED_MIN),
			twinkleMax:
				StarConfig.TWINKLE_MAX_MIN +
				Math.random() * (StarConfig.TWINKLE_MAX_MAX - StarConfig.TWINKLE_MAX_MIN),
			type: 'star'
		};
	}

	/**
	 * Update a single star particle
	 */
	private _updateStarParticle(particle: StarParticle, deltaTime: number): void {
		// Update direction change timer
		particle.directionChangeTime += deltaTime;

		if (particle.directionChangeTime > particle.directionChangeInterval) {
			particle.directionChangeTime = 0;
			particle.directionChangeInterval =
				StarConfig.MIN_DIRECTION_CHANGE +
				Math.random() * (StarConfig.MAX_DIRECTION_CHANGE - StarConfig.MIN_DIRECTION_CHANGE);

			// Set new target velocities
			particle.targetVx = (Math.random() - 0.5) * StarConfig.TARGET_VELOCITY_FACTOR;
			particle.targetVy = (Math.random() - 0.5) * StarConfig.TARGET_VELOCITY_FACTOR;
		}

		// Ease toward target velocity
		particle.vx += (particle.targetVx - particle.vx) * StarConfig.EASING_FACTOR;
		particle.vy += (particle.targetVy - particle.vy) * StarConfig.EASING_FACTOR;

		// Move particle
		particle.x += particle.vx * deltaTime * StarConfig.MOVEMENT_SPEED;
		particle.y += particle.vy * deltaTime * StarConfig.MOVEMENT_SPEED;

		// Twinkling effect - slower and more subtle
		particle.twinkleFactor +=
			particle.twinkleDirection * particle.twinkleSpeed * deltaTime * StarConfig.TWINKLE_FACTOR;

		if (particle.twinkleFactor > particle.twinkleMax) {
			particle.twinkleDirection = -1;
		}

		if (particle.twinkleFactor < 0) {
			particle.twinkleDirection = 1;
		}

		// Wrap around screen edges
		this._wrapStarParticleAtEdges(particle);
	}

	/**
	 * Wrap star particle at screen edges
	 */
	private _wrapStarParticleAtEdges(particle: StarParticle): void {
		if (particle.x < -StarConfig.EDGE_BUFFER) {
			particle.x = this.width + StarConfig.EDGE_BUFFER;
		}

		if (particle.x > this.width + StarConfig.EDGE_BUFFER) {
			particle.x = -StarConfig.EDGE_BUFFER;
		}

		if (particle.y < -StarConfig.EDGE_BUFFER) {
			particle.y = this.height + StarConfig.EDGE_BUFFER;
		}

		if (particle.y > this.height + StarConfig.EDGE_BUFFER) {
			particle.y = -StarConfig.EDGE_BUFFER;
		}
	}
}
