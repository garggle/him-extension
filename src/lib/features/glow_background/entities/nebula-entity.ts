import type { NebulaCloud } from './nebula-cloud.js';
import type { StarParticle } from './star-particle.js';

/**
 * Combined type for both nebula clouds and star particles
 * Used for sorting entities by depth when rendering
 */
type NebulaEntity = NebulaCloud | StarParticle;

export type { NebulaEntity };
