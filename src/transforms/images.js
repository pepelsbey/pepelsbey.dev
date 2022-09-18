module.exports = function(window) {
    const content = window.document.getElementById('article-content');

    if (!content) return;

    const images = content.querySelectorAll('p > img');

    for (const image of images) {
        const paragraph = image.parentNode;
        const figure = window.document.createElement('figure');

        figure.append(image);
        paragraph.replaceWith(figure);
    }
}
