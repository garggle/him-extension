import adapter from 'sveltekit-adapter-chrome-extension';

const config = {
	kit: {
		adapter: adapter({
			// default options are shown
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			manifest: 'manifest.json'
		}),
		appDir: 'app'
	}
};

export default config;
