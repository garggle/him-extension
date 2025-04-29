/**
 * Simple utility to split messages into smaller chunks based on dots followed by spaces
 */

/**
 * Splits a text into multiple message chunks at each dot followed by a space
 *
 * @param text The text to split
 * @returns An array of message chunks
 */
export function splitIntoMessages(text: string): string[] {
	// Trim whitespace and return empty array for empty text
	const trimmedText = text.trim();
	if (!trimmedText) {
		return [];
	}

	// For very short text, just return as is
	if (trimmedText.length < 20) {
		return [trimmedText];
	}

	// Split text at every dot followed by a space
	const chunks = trimmedText.split('. ');

	// Process the chunks to handle the final period
	return chunks
		.map((chunk, index, array) => {
			// For all chunks except the last one, add the period back
			if (index < array.length - 1) {
				return chunk + '.';
			}
			// For the last chunk, only add period if the original text ended with a period
			return trimmedText.endsWith('.') && !chunk.endsWith('.') ? chunk + '.' : chunk;
		})
		.filter((chunk) => chunk.trim().length > 0);
}
