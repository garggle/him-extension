/**
 * Utilities for clipboard interactions
 */

// Type for clipboard event handler
type ClipboardEventHandler = (data: string) => void;

// Store clipboard event handlers
let clipboardHandlers: ClipboardEventHandler[] = [];

/**
 * Add a handler for clipboard copy events
 * Returns a function to remove the handler
 */
export function addClipboardCopyHandler(handler: ClipboardEventHandler): () => void {
	clipboardHandlers.push(handler);

	// Return cleanup function
	return () => {
		clipboardHandlers = clipboardHandlers.filter((h) => h !== handler);
	};
}

/**
 * Initialize clipboard event listeners
 * Should be called once when the application starts
 */
export function initClipboardInterception(): void {
	document.addEventListener('copy', (e) => {
		const clipboardData = e.clipboardData?.getData('text/plain');
		if (clipboardData) {
			// Call all registered handlers
			clipboardHandlers.forEach((handler) => handler(clipboardData));
		}
	});
}

/**
 * Read text from clipboard
 * Returns null if clipboard reading fails or is empty
 */
export async function readFromClipboard(): Promise<string | null> {
	try {
		// First try the standard Clipboard API
		if (navigator.clipboard && navigator.clipboard.readText) {
			try {
				const text = await navigator.clipboard.readText();
				return text || null;
			} catch (clipError) {
				console.log('Standard clipboard API failed, trying alternative method...');
				// If this fails due to permissions, fall back to the DOM-based approach
			}
		}

		// For Chrome extensions, use a different method with textarea
		// Create a temporary textarea element
		const textarea = document.createElement('textarea');
		// Style it to be as invisible as possible
		textarea.style.position = 'fixed';
		textarea.style.top = '0';
		textarea.style.left = '0';
		textarea.style.width = '1px';
		textarea.style.height = '1px';
		textarea.style.padding = '0';
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.boxShadow = 'none';
		textarea.style.background = 'transparent';

		// Add to the DOM
		document.body.appendChild(textarea);

		// Focus and select the textarea
		textarea.focus();

		// Execute the copy command to get clipboard contents
		const successful = document.execCommand('paste');

		// Get the clipboard text
		const text = textarea.value;

		// Clean up by removing the textarea
		document.body.removeChild(textarea);

		if (successful) {
			return text || null;
		}

		// If all methods fail
		console.warn(
			'Could not read from clipboard - please allow clipboard permissions or manually paste the token address'
		);
		return null;
	} catch (error) {
		console.error('Error reading from clipboard:', error);
		return null;
	}
}

/**
 * Write text to clipboard
 * Returns true if successful, false otherwise
 */
export async function writeToClipboard(text: string): Promise<boolean> {
	try {
		// // First try standard clipboard API
		// if (navigator.clipboard && navigator.clipboard.writeText) {
		// 	try {
		// 		await navigator.clipboard.writeText(text);
		// 		return true;
		// 	} catch (clipError) {
		// 		console.log('Standard clipboard API failed, trying alternative method...');
		// 		// If this fails, fall back to execCommand
		// 	}
		// }

		// Create a temporary textarea element
		const textarea = document.createElement('textarea');
		textarea.value = text;
		// Style it to be invisible
		textarea.style.position = 'fixed';
		textarea.style.top = '0';
		textarea.style.left = '0';
		textarea.style.width = '1px';
		textarea.style.height = '1px';
		textarea.style.padding = '0';
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.boxShadow = 'none';
		textarea.style.background = 'transparent';

		// Add to the DOM
		document.body.appendChild(textarea);

		// Select the text
		textarea.select();

		// Copy text to clipboard
		const successful = document.execCommand('copy');

		// Clean up
		document.body.removeChild(textarea);

		return successful;
	} catch (error) {
		console.error('Error writing to clipboard:', error);
		return false;
	}
}

/**
 * Extract token address from clipboard content
 * This tries to find Solana addresses (base58 encoding, 32-44 chars)
 */
export function extractTokenAddressFromClipboard(clipboardText: string): string | null {
	if (!clipboardText) return null;

	console.log(
		'Extracting address from clipboard text:',
		clipboardText.substring(0, 50) + (clipboardText.length > 50 ? '...' : '')
	);

	// Remove any whitespace, newlines, or common URL components
	const cleanedText = clipboardText.replace(/\s+/g, '');

	// Try to match a Solana address (base58 encoding)
	// More strict pattern: must be 32-44 chars of base58 alphabet
	const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
	const matches = cleanedText.match(solanaAddressRegex);

	if (matches && matches.length > 0) {
		console.log('Found address match:', matches[0]);
		return matches[0];
	}

	console.log('No valid address found in clipboard');
	return null;
}
