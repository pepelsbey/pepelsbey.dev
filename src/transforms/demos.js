module.exports = function(window) {
    const content = window.document.getElementById('article-content');

    if (!content) return;

    const iframes = content.querySelectorAll('iframe');

    for (const iframe of iframes) {
        const source = iframe.getAttribute('src');
        const wrapper = window.document.createElement('figure');

        wrapper.classList.add('figure');
        iframe.classList.add('figure__content');

        wrapper.innerHTML = `
            ${iframe.outerHTML}
            <figcaption class="figure__caption">
                <a class="figure__link action" href="${source}" target="_blank" rel="nofollow noopener noreferrer">
                    Open in the new tab
                    <svg class="action__icon" width="24" height="24" aria-hidden="true">
                        <use href="/images/icons.svg#external">
                    </svg>
                </a>
            </figcaption>
        `;

        iframe.replaceWith(wrapper);
    }

    [...iframes]
        .forEach((iframe) => {
            const source = iframe.getAttribute('src');
            const wrapper = window.document.createElement('figure');

            wrapper.classList.add('figure');
            iframe.classList.add('figure__content');

            wrapper.innerHTML = `
                ${iframe.outerHTML}
                <figcaption class="figure__caption">
                    <a class="figure__link action" href="${source}" target="_blank" rel="nofollow noopener noreferrer">
                        Open in the new tab
                        <svg class="action__icon" width="24" height="24" aria-hidden="true">
                            <use href="/images/icons.svg#external">
                        </svg>
                    </a>
                </figcaption>
            `;
            iframe.replaceWith(wrapper);
        });
}
