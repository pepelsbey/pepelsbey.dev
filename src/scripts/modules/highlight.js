import { highlightAll } from 'microlighter';

import { languageAliases } from './languages.js';

if (CSS.highlights) {
	highlightAll({ languageAliases });
}
