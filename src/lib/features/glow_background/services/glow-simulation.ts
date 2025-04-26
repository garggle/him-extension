import { nebulaPalettes } from '$lib/shared/constants/GlowConstants.js';
import { hexToHsl, rgbaHexToHex } from '$lib/shared/utils/ColorUtils.js';
import { SimulationConfig } from '../config/simulation-config.js';
import type { NebulaEntity } from '../entities/nebula-entity.js';
import { NebulaCloudManager } from './nebula-cloud-manager.js';
import { StarParticleManager } from './star-particle-manager.js';

// Combined type for sorting by depth
// export type NebulaEntity = NebulaCloud | StarParticle;

export class GlowSimulation {
	// Entity managers
	private nebulaCloudManager: NebulaCloudManager;
	private starParticleManager: StarParticleManager;

	private dominantNebulaHSL: string | null = null;
	private frameSkip = 0;

	constructor(width: number, height: number, isMobile: boolean) {
		// Initialize entity managers
		this.nebulaCloudManager = new NebulaCloudManager(width, height, isMobile);
		this.starParticleManager = new StarParticleManager(width, height, isMobile);
	}

	/**
	 * Updates the simulation dimensions, typically called after a resize event
	 */
	public updateDimensions(width: number, height: number, isMobile: boolean): void {
		// Update dimensions in managers
		this.nebulaCloudManager.updateDimensions(width, height, isMobile);
		this.starParticleManager.updateDimensions(width, height, isMobile);
	}

	/**
	 * Initializes all entities in the simulation
	 */
	public initializeEntities(): void {
		// Initialize both managers
		this.nebulaCloudManager.initialize();
		this.starParticleManager.initialize();

		// Calculate initial dominant color
		this.calculateDominantColor();
	}

	/**
	 * Updates the simulation entities based on the elapsed time
	 */
	public update(deltaTime: number): void {
		// Detect very slow framerates and apply additional optimizations
		const fps = 1000 / deltaTime;
		const isLowFPS = fps < SimulationConfig.LOW_FPS_THRESHOLD;

		// Frame skipping for performance
		this.frameSkip = (this.frameSkip + 1) % (isLowFPS ? SimulationConfig.LOW_FPS_FRAME_SKIP : 1);
		const shouldUpdateMovement = this.frameSkip === 0;

		if (shouldUpdateMovement) {
			// Update nebula clouds and star particles through their managers
			this.nebulaCloudManager.update(deltaTime);
			this.starParticleManager.update(deltaTime);
		}
	}

	/**
	 * Returns all entities to render, sorted by depth
	 */
	public getEntitiesToRender(): NebulaEntity[] {
		// Get entities from both managers
		const nebulaClouds = this.nebulaCloudManager.getClouds();
		const starParticles = this.starParticleManager.getStars();

		// Create combined entity array for depth sorting
		const combinedEntities: NebulaEntity[] = [...nebulaClouds, ...starParticles];

		// Sort by depth (ascending, so deeper objects are drawn first)
		return combinedEntities.sort((a, b) => a.depth - b.depth);
	}

	/**
	 * Calculates the dominant nebula color based on palette weights
	 */
	private calculateDominantColor(): void {
		const paletteWeights = this.nebulaCloudManager.getColorWeights();

		if (paletteWeights.length === 0) {
			this.dominantNebulaHSL = null;
			return;
		}

		// Find the dominant palette index
		const dominantPaletteData = paletteWeights.reduce(
			(max, current) => (current.weight > max.weight ? current : max),
			paletteWeights[0]
		);

		// Get the representative color from the dominant palette (using the middle color stop)
		const dominantPalette = nebulaPalettes[dominantPaletteData.paletteIndex];
		const representativeColor = dominantPalette[1].color; // Use the middle color stop

		// Convert RGBA hex to regular hex, then to HSL
		const hex = rgbaHexToHex(representativeColor);
		const hsl = hexToHsl(hex);

		// Format HSL string and update state
		this.dominantNebulaHSL = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
	}

	/**
	 * Returns the dominant nebula color in HSL format
	 */
	public getDominantColorHSL(): string | null {
		return this.dominantNebulaHSL;
	}
}
