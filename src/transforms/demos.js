module.exports = function (window, content) {
    const articleContent = window.document.getElementById('article-content');

    if (!articleContent) {
        return;
    }

    const iframes = articleContent.querySelectorAll('iframe');

    [...iframes]
        .filter((iframe) => iframe.getAttribute('src').includes('demos/'))
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
