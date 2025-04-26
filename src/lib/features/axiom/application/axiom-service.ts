/**
 * Service for Axiom token data operations
 */
import type { AxiomTokenData } from '../data/datasources/axiom-scraper.js';
import { axiomRepository } from '../data/repositories/axiom-repository.js';

/**
 * Service class for handling Axiom token operations
 */
export class AxiomService {
	/**
	 * Fetches all relevant data from a token when on an Axiom meme page
	 * @returns Token data or null if not on a valid page
	 */
	public async getTokenData(): Promise<AxiomTokenData | null> {
		return await axiomRepository.fetchTokenData();
	}
}

// Create a singleton instance of the service
export const axiomService = new AxiomService();
