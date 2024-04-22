const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
	js.configs.recommended,

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
