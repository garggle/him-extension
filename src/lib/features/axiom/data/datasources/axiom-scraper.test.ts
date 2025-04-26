import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scrapeAxiomTokenData } from './axiom-scraper.js';

describe('axiom-scraper', () => {
	// Save the original window.location
	const originalLocation = window.location;

	// Mock document.evaluate
	const mockEvaluate = vi.fn();

	beforeEach(() => {
		// Define a mock implementation of document.evaluate
		document.evaluate = mockEvaluate;

		// Reset window.location to mock it
		delete (window as any).location;
		window.location = {
			...originalLocation,
			href: 'https://axiom.trade/meme/test-token'
		} as Location;
	});

	afterEach(() => {
		// Restore window.location
		window.location = originalLocation;

		// Clear all mocks
		vi.clearAllMocks();
	});

	it('should return null if not on an Axiom meme page', () => {
		// Set URL to a non-Axiom page
		window.location.href = 'https://example.com';

		// Call the function
		const result = scrapeAxiomTokenData();

		// Verify result is null
		expect(result).toBeNull();

		// Verify document.evaluate was not called
		expect(mockEvaluate).not.toHaveBeenCalled();
	});

	it('should scrape data if on an Axiom meme page', () => {
		// Set URL to an Axiom meme page
		window.location.href = 'https://axiom.trade/meme/test-token';

		// Mock the XPath result for each field
		mockEvaluate.mockImplementation((xpath) => {
			return {
				singleNodeValue: {
					textContent: `Mock value for ${xpath}`
				}
			};
		});

		// Call the function
		const result = scrapeAxiomTokenData();

		// Verify result is not null
		expect(result).not.toBeNull();

		// Verify each field was extracted
		Object.keys(result!).forEach((key) => {
			expect(result![key as keyof typeof result]).toMatch(/^Mock value for /);
		});

		// Verify document.evaluate was called for each XPath
		expect(mockEvaluate).toHaveBeenCalled();
	});

	it('should handle elements not found', () => {
		// Set URL to an Axiom meme page
		window.location.href = 'https://axiom.trade/meme/test-token';

		// Mock the XPath result to return null
		mockEvaluate.mockImplementation(() => {
			return { singleNodeValue: null };
		});

		// Call the function
		const result = scrapeAxiomTokenData();

		// Verify result is not null (should return object with nulls)
		expect(result).not.toBeNull();

		// Verify each field is null
		Object.keys(result!).forEach((key) => {
			expect(result![key as keyof typeof result]).toBeNull();
		});
	});

	it('should handle exceptions during extraction', () => {
		// Set URL to an Axiom meme page
		window.location.href = 'https://axiom.trade/meme/test-token';

		// Mock console.error
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Make document.evaluate throw an error
		mockEvaluate.mockImplementation(() => {
			throw new Error('Test error');
		});

		// Call the function
		const result = scrapeAxiomTokenData();

		// Verify result is not null (should return object with nulls)
		expect(result).not.toBeNull();

		// Verify that all fields are null
		Object.keys(result!).forEach((key) => {
			expect(result![key as keyof typeof result]).toBeNull();
		});

		// Verify console.error was called
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});
