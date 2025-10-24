// eslint.config.js (flat config)
import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig([
  // Respect .gitignore
  includeIgnoreFile(gitignorePath),

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...ts.configs.recommended,

  // Svelte rules (flat config)
  ...svelte.configs['flat/recommended'],

  // Project-wide language options & common rules
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      // TS projects shouldn’t use no-undef
      'no-undef': 'off'
    }
  },

  // Svelte-specific parser options (only for .svelte files)
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        // Provide your svelte.config.js contents so ESLint/Svelte share settings
        svelteConfig
        // Alternatively: svelteConfigFile: 'svelte.config.js'
      }
    }
  },

  // Prettier last: disable formatting-conflict rules
  prettier,
  ...svelte.configs['flat/prettier']
]);
