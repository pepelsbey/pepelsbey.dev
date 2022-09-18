module.exports = function(window) {
    const content = window.document.getElementById('article-content');

    if (!content) return;

    const iframes = content.querySelectorAll('iframe');

    for (const iframe of iframes) {
        const source = iframe.getAttribute('src');
        const wrapper = window.document.createElement('figure');

        wrapper.innerHTML = `
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

        iframe.replaceWith(wrapper);
    }
}
