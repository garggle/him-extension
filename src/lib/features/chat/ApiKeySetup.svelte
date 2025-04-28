<script lang="ts">
	import { hasApiKey, storeApiKey } from './data/openai-api.js';

	const { onComplete } = $props();

	// State management with runes
	let isKeyConfigured = $state(false);
	let isSettingUp = $state(false);
	let errorMessage = $state('');
	let apiKey = $state('');

	// Check if the API key is already configured on mount
	$effect(() => {
		checkApiKeyStatus();
	});

	async function checkApiKeyStatus() {
		try {
			isKeyConfigured = await hasApiKey();
		} catch (error) {
			console.error('Error checking API key status:', error);
		}
	}

	async function handleSave() {
		errorMessage = '';

		// Validate inputs
		if (!apiKey.trim()) {
			errorMessage = 'API key is required';
			return;
		}

		// Basic validation for OpenAI API key format
		if (!apiKey.trim().startsWith('sk-')) {
			errorMessage = 'API key should start with "sk-"';
			return;
		}

		try {
			isSettingUp = true;
			await storeApiKey(apiKey);
			isKeyConfigured = true;

			// Reset values for security
			apiKey = '';

			// Call completion callback if provided
			onComplete?.();
		} catch (error) {
			console.error('Error saving API key:', error);
			errorMessage =
				'Failed to save API key: ' + (error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSettingUp = false;
		}
	}

	async function handleReset() {
		try {
			// Clear the API key from storage
			await chrome.storage.sync.remove('openaiApiKey');
			isKeyConfigured = false;
			errorMessage = '';
		} catch (error) {
			console.error('Error clearing API key:', error);
			errorMessage =
				'Failed to clear API key: ' + (error instanceof Error ? error.message : 'Unknown error');
		}
	}
</script>

<div class="p-4 bg-user-bg/30 rounded-md border border-user-border/60 shadow-lg max-w-md mx-auto">
	<h2
		class="text-xl mb-4 text-[#EED2FF] text-center"
		style="text-shadow: 0px 0px 4px rgba(238, 210, 255, 0.7);"
	>
		OpenAI API Setup
	</h2>

	{#if isKeyConfigured}
		<div class="text-center mb-4 text-[#EED2FF]/90">
			<p>Your OpenAI API key is configured.</p>
			<p class="text-sm mt-2">Your API key is stored securely in your browser.</p>
		</div>

		<div class="flex justify-center mt-4">
			<button
				on:click={handleReset}
				class="px-4 py-2 bg-user-bg/60 border border-user-border/70 rounded-md text-[#EED2FF]/90 hover:bg-user-bg/80 transition-colors"
			>
				Configure New Key
			</button>
		</div>
	{:else}
		<div class="mb-4">
			<p class="text-sm text-[#EED2FF]/90 mb-4">
				To use Him, you need to provide your own OpenAI API key. Your key will be stored securely in
				your browser.
			</p>

			{#if errorMessage}
				<div class="text-red-400 text-sm mb-4 p-2 bg-red-950/30 rounded border border-red-900/50">
					{errorMessage}
				</div>
			{/if}

			<div class="space-y-3">
				<div>
					<label for="apiKey" class="block text-sm text-[#EED2FF]/90 mb-1">OpenAI API Key</label>
					<input
						type="password"
						id="apiKey"
						bind:value={apiKey}
						class="w-full bg-user-bg/50 text-user-text p-2 rounded-md focus:outline-none border border-user-border/60 text-sm"
						placeholder="sk-..."
					/>
					<p class="text-xs text-[#EED2FF]/60 mt-1">Must start with 'sk-'</p>
				</div>
			</div>
		</div>

		<div class="flex justify-end">
			<button
				on:click={handleSave}
				disabled={isSettingUp}
				class="px-4 py-2 bg-user-bg/60 border border-user-border/70 rounded-md text-[#EED2FF]/90 hover:bg-user-bg/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSettingUp ? 'Saving...' : 'Save API Key'}
			</button>
		</div>
	{/if}
</div>

<style>
	input:focus {
		outline: none;
		box-shadow:
			0 0 8px hsla(var(--primary), 0.7),
			0 0 12px hsla(var(--primary), 0.5);
		border-color: hsla(var(--primary-foreground), 0.6);
	}
</style>
