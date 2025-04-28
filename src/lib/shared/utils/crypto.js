/**
 * Utilities for encrypting and decrypting sensitive data like API keys
 * Uses browser's WebCrypto API with AES-GCM algorithm
 */

/**
 * Generates a key from a password using PBKDF2
 */
export async function generateKey(password, salt) {
	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);

	// Import the password as a key
	const baseKey = await window.crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);

	// Derive a key using PBKDF2
	return window.crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Encrypts a string using AES-GCM
 * Returns an object with all the data needed for decryption
 */
export async function encryptData(data, password) {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);

	// Generate a random salt
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	// Generate a random initialization vector
	const iv = window.crypto.getRandomValues(new Uint8Array(12));

	// Generate the key
	const key = await generateKey(password, salt);

	// Encrypt the data
	const encryptedBuffer = await window.crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv
		},
		key,
		dataBuffer
	);

	// Convert to base64 strings for storage
	return {
		iv: btoa(String.fromCharCode(...iv)),
		salt: btoa(String.fromCharCode(...salt)),
		encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)))
	};
}

/**
 * Decrypts encrypted data using AES-GCM
 */
export async function decryptData(encryptedData, iv, salt, password) {
	// Convert from base64 strings back to ArrayBuffers
	const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
	const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
	const saltBuffer = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));

	// Generate the key using the same password and salt
	const key = await generateKey(password, saltBuffer);

	// Decrypt the data
	const decryptedBuffer = await window.crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: ivBuffer
		},
		key,
		encryptedBuffer
	);

	// Convert the decrypted ArrayBuffer back to a string
	const decoder = new TextDecoder();
	return decoder.decode(decryptedBuffer);
}
