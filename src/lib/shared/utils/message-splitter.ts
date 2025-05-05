/**
 * Utility to split messages into smaller chunks based on emoji category delimiters
 */

/**
 * Splits a text into multiple message chunks at each emoji category delimiter (✅, ✨, 👥, 🐳, 🚨)
 * Each chunk will start with the delimiter emoji (except possibly the first one)
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

	// Define emoji category delimiters
	const emojiDelimiters = ['✅', '✨', '👥', '🐳', '🚨'];

	// Create a regex pattern to match any of the emoji delimiters at the start of a line
	// or with spaces/newlines before them
	const delimiterPattern = new RegExp(`(^|\\s+)(${emojiDelimiters.join('|')})`, 'g');

	// Add a space before each emoji delimiter to ensure consistent splitting
	// But don't add a space if the emoji is at the very beginning of the text
	let processedText = trimmedText;
	for (const emoji of emojiDelimiters) {
		// Don't add space if it's at the beginning of the text
		if (processedText.startsWith(emoji)) continue;

		// Add space before emoji elsewhere in the text
		processedText = processedText.replace(new RegExp(`([^\\s])(${emoji})`, 'g'), '$1\n$2');
	}

	// Split by newlines and filter out empty lines
	const lines = processedText.split('\n').filter((line) => line.trim());

	// Initialize result array and current chunk
	const chunks: string[] = [];
	let currentChunk = '';

	// Process each line
	for (const line of lines) {
		// Check if this line starts with a delimiter
		const startsWithDelimiter = emojiDelimiters.some((emoji) => line.trim().startsWith(emoji));

		if (startsWithDelimiter && currentChunk) {
			// Save the previous chunk if it exists
			chunks.push(currentChunk.trim());
			currentChunk = line;
		} else {
			// Add to current chunk with a newline if not empty
			if (currentChunk) {
				currentChunk += '\n' + line;
			} else {
				currentChunk = line;
			}
		}
	}

	// Add the last chunk if it's not empty
	if (currentChunk.trim()) {
		chunks.push(currentChunk.trim());
	}

	return chunks.filter((chunk) => chunk.trim().length > 0);
}
