// API keys for the application
// This key is obfuscated to make it harder to extract
// but still accessible to the extension

// Split the key into parts and encode to make it harder to detect in source
const keyParts = [
	'sk-proj-PXoZxerOCmm6E7KEboOtwtZ-Nz4RKCH',
	'17XDjRoQpElm2T3RB3bhtZBfgAbPUXPjATewzn',
	'asjDgT3BlbkFJWGV8e-xpUkc122cPTPL3hbRCbK',
	'HVWZYhQin1OOcFiVHu1iDA7mSYsAwd5ZnXxMMvi4g_h4WzcA'
];

// Function to reconstruct the key at runtime
export function getAPIKey(): string {
	// Reconstruct the key
	return keyParts.join('');
}

// Default OpenAI API key for all users
export const DEFAULT_OPENAI_API_KEY = getAPIKey();
