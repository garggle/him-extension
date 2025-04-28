/**
 * Utility for secure local storage of session data
 * Provides methods to store and retrieve data encrypted with the browser's crypto API
 */

// Key for storing the session salt
const SESSION_SALT_KEY = 'him_session_salt';
const SESSION_DATA_KEY = 'him_session_data';

/**
 * Generate a random salt for encryption
 * @returns A base64 encoded salt
 */
function generateSalt(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode.apply(null, [...array]));
}

/**
 * Get or create a session salt
 * This salt is used for simple encryption of sensitive data during the session
 */
function getSessionSalt(): string {
	let salt = sessionStorage.getItem(SESSION_SALT_KEY);
	if (!salt) {
		salt = generateSalt();
		sessionStorage.setItem(SESSION_SALT_KEY, salt);
	}
	return salt;
}

/**
 * Simple encryption for session storage
 * This is NOT meant for long-term storage of sensitive data
 * but provides basic obfuscation during a browser session
 */
async function encryptForSession(data: string): Promise<string> {
	const salt = getSessionSalt();
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);

	// Create a simple key from the salt
	const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(salt));

	// XOR the data with the key material
	const keyArray = new Uint8Array(keyMaterial);
	const result = new Uint8Array(dataBuffer.length);

	for (let i = 0; i < dataBuffer.length; i++) {
		result[i] = dataBuffer[i] ^ keyArray[i % keyArray.length];
	}

	return btoa(String.fromCharCode.apply(null, [...result]));
}

/**
 * Decrypt session storage data
 */
async function decryptFromSession(encryptedData: string): Promise<string> {
	const salt = getSessionSalt();
	const encoder = new TextEncoder();

	// Create a simple key from the salt
	const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(salt));
	const keyArray = new Uint8Array(keyMaterial);

	try {
		// Decode base64
		const encryptedBytes = atob(encryptedData);
		const encryptedArray = new Uint8Array(encryptedBytes.length);
		for (let i = 0; i < encryptedBytes.length; i++) {
			encryptedArray[i] = encryptedBytes.charCodeAt(i);
		}

		// XOR to decrypt
		const result = new Uint8Array(encryptedArray.length);
		for (let i = 0; i < encryptedArray.length; i++) {
			result[i] = encryptedArray[i] ^ keyArray[i % keyArray.length];
		}

		// Convert back to string
		const decoder = new TextDecoder();
		return decoder.decode(result);
	} catch (error) {
		console.error('Error decrypting session data:', error);
		return '';
	}
}

/**
 * Store a value in session storage with simple encryption
 */
export async function storeSessionValue(key: string, value: string): Promise<void> {
	try {
		const dataStr = localStorage.getItem(SESSION_DATA_KEY) || '{}';
		const data = JSON.parse(dataStr);

		// Encrypt the value
		const encryptedValue = await encryptForSession(value);

		// Store in the data object
		data[key] = encryptedValue;

		// Save back to storage
		localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Error storing session value:', error);
	}
}

/**
 * Retrieve a value from session storage and decrypt it
 * Returns empty string if not found or decryption fails
 */
export async function getSessionValue(key: string): Promise<string> {
	try {
		const dataStr = localStorage.getItem(SESSION_DATA_KEY) || '{}';
		const data = JSON.parse(dataStr);

		if (!data[key]) return '';

		// Decrypt the value
		return await decryptFromSession(data[key]);
	} catch (error) {
		console.error('Error retrieving session value:', error);
		return '';
	}
}

/**
 * Clear all session data
 */
export function clearSessionData(): void {
	localStorage.removeItem(SESSION_DATA_KEY);
}
