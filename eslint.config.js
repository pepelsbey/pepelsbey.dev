import globals from 'globals';
import js from '@eslint/js';

export default [
	js.configs.recommended,

	{
		ignores: ['dist/**/*.js'],
	},

	{
		ignores: ['src/scripts/**/*.js'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},

	{
		files: ['src/scripts/**/*.js'],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},
];
