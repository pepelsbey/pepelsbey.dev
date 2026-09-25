import { applyScheme, getSavedScheme } from './modules/scheme.js';

const savedScheme = getSavedScheme();

if (savedScheme !== null) {
	applyScheme(savedScheme);
}
