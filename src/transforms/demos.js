import minifyHtml from '@minify-html/node';

export default async function(window) {
	const content = window.document.getElementById('article-content');

	if (!content) return;

	const iframes = content.querySelectorAll('iframe');

	for (const iframe of iframes) {
		const source = iframe.getAttribute('src');
		const wrapper = window.document.createElement('figure');

		const template = `
			${iframe.outerHTML}
			<figcaption>
				<a class="action" href="${source}" target="_blank">
					Open in the new tab
					<svg class="action__icon" width="24" height="24" aria-hidden="true">
						<use href="/images/icons.svg#external">
					</svg>
				</a>
			</figcaption>
		`;

		wrapper.innerHTML = minifyHtml.minify(
			Buffer.from(template), {
				keep_closing_tags: true,
				keep_html_and_head_opening_tags: true,
				keep_spaces_between_attributes: true,
			}
		).toString();

		iframe.replaceWith(wrapper);
	}
}
