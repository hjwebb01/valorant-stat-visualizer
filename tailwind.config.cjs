import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				'sans': ['Roboto Mono', 'Courier New', 'monospace'],
				'heading': ['Orbitron', 'sans-serif'],
				'mono': ['JetBrains Mono', 'Roboto Mono', 'Courier New', 'monospace']
			}
		}
	},
	plugins: [
		skeleton({
			themes: { preset: ['skeleton', 'wintry'] }
		})
	]
};
