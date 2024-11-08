import { Node } from 'linkedom';

export default function(window) {
	const content = window.document.getElementById('article-content');

	if (!content) return;

	const images = content.querySelectorAll('p > img');

	for (const image of images) {
		const paragraph = image.parentNode;
		const figure = window.document.createElement('figure');
		let sibling = image.nextSibling;

		image.setAttribute('loading', 'lazy');
		image.setAttribute('decoding', 'async');
		figure.append(image);

		if (sibling) {
			const caption = window.document.createElement('figcaption');
			const content = [];

			while(sibling) {
				content.push(sibling);
				sibling = sibling.nextSibling;
			}

			caption.innerHTML = content
				.map((fragment) => (
					fragment.nodeType === Node.TEXT_NODE
						? fragment.textContent
						: fragment.outerHTML
				))
				.join('')

			figure.appendChild(caption);
		}

		paragraph.replaceWith(figure);
	}
}
