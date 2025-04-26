import type { NebulaCloud } from './NebulaCloud.js';
import type { StarParticle } from './StarParticle.js';

/**
 * Combined type for both nebula clouds and star particles
 * Used for sorting entities by depth when rendering
 */
type NebulaEntity = NebulaCloud | StarParticle;

export type { NebulaEntity };
