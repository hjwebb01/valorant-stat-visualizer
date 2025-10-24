#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const dir = path.join(process.cwd(), '.svelte-kit');
const file = path.join(dir, 'tsconfig.json');

const stub = {
	compilerOptions: {
		paths: {
			$lib: ['../src/lib'],
			'$lib/*': ['../src/lib/*'],
			'$app/types': ['./types/index.d.ts']
		},
		rootDirs: ['..', './types'],
		verbatimModuleSyntax: true,
		isolatedModules: true,
		lib: ['esnext', 'DOM', 'DOM.Iterable'],
		moduleResolution: 'bundler',
		module: 'esnext',
		noEmit: true,
		target: 'esnext',
		types: ['@sveltejs/kit'],
		skipLibCheck: true
	},
	include: [
		'ambient.d.ts',
		'non-ambient.d.ts',
		'./types/**/$types.d.ts',
		'../vite.config.js',
		'../vite.config.ts',
		'../src/**/*.js',
		'../src/**/*.ts',
		'../src/**/*.svelte',
		'../tests/**/*.js',
		'../tests/**/*.ts',
		'../tests/**/*.svelte'
	],
	exclude: [
		'../node_modules/**',
		'../src/service-worker.js',
		'../src/service-worker/**/*.js',
		'../src/service-worker.ts',
		'../src/service-worker/**/*.ts',
		'../src/service-worker.d.ts',
		'../src/service-worker/**/*.d.ts'
	]
};

async function ensure() {
	try {
		await fs.access(file);
		// file exists - nothing to do
		// console.log('.svelte-kit/tsconfig.json already exists');
	} catch (err) {
		// create dir if needed
		try {
			await fs.mkdir(dir, { recursive: true });
			await fs.writeFile(file, JSON.stringify(stub, null, 2), { encoding: 'utf8' });
			// console.log('Wrote .svelte-kit/tsconfig.json stub');
		} catch (writeErr) {
			// eslint-disable-next-line no-console
			console.error('Failed to write .svelte-kit/tsconfig.json:', writeErr);
			process.exitCode = 1;
		}
	}
}

ensure();
