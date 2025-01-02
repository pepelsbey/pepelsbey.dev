import globals from 'globals';
import js from '@eslint/js';

const browserScripts = [
	'src/scripts/**/*.js',
	'src/articles/**/*.js',
];

export default [
	js.configs.recommended,

	{
		ignores: ['dist/**/*.js'],
	},

	{
		ignores: browserScripts,
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},

	{
		files: browserScripts,
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},
];
