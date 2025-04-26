<script lang="ts">
	import { onMount } from 'svelte';
	import { axiomService } from '../../application/axiom-service.js';
	import type { AxiomTokenData } from '../../data/datasources/axiom-scraper.js';

	// State to hold the token data
	let tokenData: AxiomTokenData | null = null;
	let error: string | null = null;
	let isLoading: boolean = false;

	/**
	 * Fetches data from the current page if on Axiom meme token page
	 */
	async function fetchTokenData() {
		try {
			isLoading = true;
			error = null;
			tokenData = await axiomService.getTokenData();

			if (!tokenData) {
				error = 'Not on an Axiom meme token page';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
			tokenData = null;
		} finally {
			isLoading = false;
		}
	}

	// Fetch data when component mounts
	onMount(() => {
		fetchTokenData();
	});
</script>

<div class="axiom-data-fetcher">
	{#if isLoading}
		<p>Loading token data...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if tokenData}
		<div class="token-data">
			<h3>Token Data</h3>

			<div class="data-grid">
				{#if tokenData.price}
					<div class="data-item">
						<span class="label">Price:</span>
						<span class="value">{tokenData.price}</span>
					</div>
				{/if}

				{#if tokenData.mcap}
					<div class="data-item">
						<span class="label">Market Cap:</span>
						<span class="value">{tokenData.mcap}</span>
					</div>
				{/if}

				{#if tokenData.liquidity}
					<div class="data-item">
						<span class="label">Liquidity:</span>
						<span class="value">{tokenData.liquidity}</span>
					</div>
				{/if}

				{#if tokenData.supply}
					<div class="data-item">
						<span class="label">Supply:</span>
						<span class="value">{tokenData.supply}</span>
					</div>
				{/if}

				{#if tokenData.top10Holders}
					<div class="data-item">
						<span class="label">Top 10 Holders:</span>
						<span class="value">{tokenData.top10Holders}</span>
					</div>
				{/if}

				{#if tokenData.developerHolding}
					<div class="data-item">
						<span class="label">Developer Holding:</span>
						<span class="value">{tokenData.developerHolding}</span>
					</div>
				{/if}

				{#if tokenData.sniperHolding}
					<div class="data-item">
						<span class="label">Sniper Holding:</span>
						<span class="value">{tokenData.sniperHolding}</span>
					</div>
				{/if}

				{#if tokenData.insiderHoldings}
					<div class="data-item">
						<span class="label">Insider Holdings:</span>
						<span class="value">{tokenData.insiderHoldings}</span>
					</div>
				{/if}

				{#if tokenData.bundlers}
					<div class="data-item">
						<span class="label">Bundlers:</span>
						<span class="value">{tokenData.bundlers}</span>
					</div>
				{/if}

				{#if tokenData.lpBurned}
					<div class="data-item">
						<span class="label">LP Burned:</span>
						<span class="value">{tokenData.lpBurned}</span>
					</div>
				{/if}

				{#if tokenData.holders}
					<div class="data-item">
						<span class="label">Holders:</span>
						<span class="value">{tokenData.holders}</span>
					</div>
				{/if}

				{#if tokenData.proTraders}
					<div class="data-item">
						<span class="label">Pro Traders:</span>
						<span class="value">{tokenData.proTraders}</span>
					</div>
				{/if}

				{#if tokenData.dexPaid}
					<div class="data-item">
						<span class="label">DEX Paid:</span>
						<span class="value">{tokenData.dexPaid}</span>
					</div>
				{/if}

				{#if tokenData.currentTimeScaleVolume}
					<div class="data-item">
						<span class="label">Volume:</span>
						<span class="value">{tokenData.currentTimeScaleVolume}</span>
					</div>
				{/if}

				{#if tokenData.currentTimeScaleBuyers}
					<div class="data-item">
						<span class="label">Buyers:</span>
						<span class="value">{tokenData.currentTimeScaleBuyers}</span>
					</div>
				{/if}

				{#if tokenData.currentTimeScaleSellers}
					<div class="data-item">
						<span class="label">Sellers:</span>
						<span class="value">{tokenData.currentTimeScaleSellers}</span>
					</div>
				{/if}

				{#if tokenData.bought}
					<div class="data-item">
						<span class="label">Bought:</span>
						<span class="value">{tokenData.bought}</span>
					</div>
				{/if}

				{#if tokenData.sold}
					<div class="data-item">
						<span class="label">Sold:</span>
						<span class="value">{tokenData.sold}</span>
					</div>
				{/if}

				{#if tokenData.holding}
					<div class="data-item">
						<span class="label">Holding:</span>
						<span class="value">{tokenData.holding}</span>
					</div>
				{/if}

				{#if tokenData.pnl}
					<div class="data-item">
						<span class="label">PnL:</span>
						<span class="value">{tokenData.pnl}</span>
					</div>
				{/if}
			</div>

			<button on:click={fetchTokenData}>Refresh Data</button>
		</div>
	{:else}
		<p>No token data available. You must be on an Axiom meme token page.</p>
		<button on:click={fetchTokenData}>Try Again</button>
	{/if}
</div>

<style>
	.axiom-data-fetcher {
		padding: 1rem;
		border-radius: 0.5rem;
		background-color: #1a1a2e;
		color: #e6e6e6;
	}

	.error {
		color: #ff6b6b;
	}

	.token-data {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.data-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.data-item {
		display: flex;
		flex-direction: column;
		background-color: rgba(255, 255, 255, 0.05);
		padding: 0.5rem 0.75rem;
		border-radius: 0.25rem;
	}

	.label {
		font-size: 0.75rem;
		opacity: 0.7;
		margin-bottom: 0.25rem;
	}

	.value {
		font-size: 1rem;
		font-weight: 500;
	}

	button {
		margin-top: 1rem;
		background-color: #4263eb;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #364fc7;
	}
</style>
