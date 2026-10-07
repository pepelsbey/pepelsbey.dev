// Resolve relative URLs against the page URL, so they don’t depend
// on the trailing slash: /articles/name and /articles/name/

const origin = 'https://localhost';

function resolve(value, base) {
	const url = value.trim();

	if (!url || url.startsWith('#') || url.startsWith('/') || URL.canParse(url)) {
		return value;
	}

	const { pathname, search, hash } = new URL(url, base);

	return pathname + search + hash;
}

export default function(window, content, outputPath) {
	const container = window.document.getElementById('article-content');

	if (!container) return;

	const pageUrl = outputPath
		.replace(/^(\.\/)?dist/, '')
		.replace(/index\.html$/, '');

	const base = new URL(pageUrl, origin);

	for (const attribute of ['src', 'href', 'poster']) {
		for (const element of container.querySelectorAll(`[${attribute}]`)) {
			element.setAttribute(
				attribute,
				resolve(element.getAttribute(attribute), base)
			);
		}
	}

	for (const element of container.querySelectorAll('[srcset]')) {
		const srcset = element.getAttribute('srcset')
			.split(',')
			.map((candidate) => {
				const [url, ...descriptors] = candidate.trim().split(/\s+/);
				return [resolve(url, base), ...descriptors].join(' ');
			})
			.join(', ');

		element.setAttribute('srcset', srcset);
	}
}
