/**
 * Simple utility to split messages into smaller chunks
 * Optimized for small-caps messages
 */

/**
 * Splits a text into multiple message chunks
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

	// Handle line breaks first - each line becomes a separate message
	if (trimmedText.includes('\n')) {
		return trimmedText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
	}

	// Simple sentence splitting for small-caps messages
	return splitIntoSentences(trimmedText);
}

/**
 * Splits text into sentences using simple punctuation rules
 */
function splitIntoSentences(text: string): string[] {
	// Basic sentence ending patterns
	const sentenceEndRegex = /[.!?](?=\s|$)/g;

	// If no sentence endings found, try fallback splitting
	if (!sentenceEndRegex.test(text)) {
		return fallbackSplitting(text);
	}

	// Reset regex state
	sentenceEndRegex.lastIndex = 0;

	const sentences: string[] = [];
	let lastIndex = 0;
	let match;

	// Extract sentences
	while ((match = sentenceEndRegex.exec(text)) !== null) {
		const sentence = text.substring(lastIndex, match.index + 1).trim();
		if (sentence) {
			sentences.push(sentence);
		}
		lastIndex = match.index + 1;

		// Skip spaces after sentence end
		while (lastIndex < text.length && /\s/.test(text[lastIndex])) {
			lastIndex++;
		}
	}

	// Add remaining text if any
	if (lastIndex < text.length) {
		const remaining = text.substring(lastIndex).trim();
		if (remaining) {
			sentences.push(remaining);
		}
	}

	return sentences;
}

/**
 * Fallback splitting method using simple delimiters
 */
function fallbackSplitting(text: string): string[] {
	// Try to split by common punctuation
	const byPunctuation = text.split(/[,;:](?=\s)/);
	if (byPunctuation.length > 1) {
		return byPunctuation.map((s) => s.trim()).filter((s) => s.length > 0);
	}

	// If we still don't have multiple segments, just return the whole text
	return [text];
}
