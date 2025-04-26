<script lang="ts">
	import { AxiomDataFetcher } from '$lib/features/axiom/index.js';
</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-4">Axiom Token Data Fetcher Demo</h1>

	<div class="mb-4">
		<p class="text-gray-200 mb-2">
			This component will automatically attempt to fetch data from an Axiom meme token page when
			loaded.
		</p>
		<p class="text-gray-200 mb-2">For this demo to work, you need to:</p>
		<ol class="list-decimal pl-6 mb-4 text-gray-200">
			<li>
				Navigate to a URL matching <code class="bg-gray-800 px-1 rounded"
					>axiom.trade/meme/&#123;anything&#125;</code
				>
			</li>
			<li>Click the "Try Again" button to fetch data from the current page</li>
		</ol>
	</div>

	<div class="border border-gray-700 rounded-lg overflow-hidden">
		<AxiomDataFetcher />
	</div>
</div>
