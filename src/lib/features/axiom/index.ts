/**
 * Axiom feature module - exports functionality for scraping data from Axiom meme token pages
 */

// Export the service for direct use
export { axiomService } from './application/axiom-service.js';

// Export the UI component
export { default as AxiomDataFetcher } from './ui/blocks/AxiomDataFetcher.svelte';

// Export the token data type for type safety
export type { AxiomTokenData } from './data/datasources/axiom-scraper.js';
