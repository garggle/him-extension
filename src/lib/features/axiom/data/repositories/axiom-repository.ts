/**
 * Repository for handling Axiom token data
 */
import type { AxiomTokenData } from '../../entities/token-data.js';
import { scrapeAxiomTokenData } from '../datasources/axiom-scraper.js';

/**
 * Repository class for accessing Axiom token data
 */
export class AxiomRepository {
	/**
	 * Fetches token data from the current Axiom meme page if on the correct URL
	 * @returns The token data or null if not on an Axiom meme page
	 */
	public async fetchTokenData(): Promise<AxiomTokenData | null> {
		return await scrapeAxiomTokenData();
	}
}

// Create a singleton instance of the repository
export const axiomRepository = new AxiomRepository();
