module.exports = function (window, content) {
    const articleContent = window.document.getElementById('article-content');

    if (!articleContent) {
        return;
    }

    const pres = articleContent.querySelectorAll('pre');

    [...pres]
        .forEach((pre) => {
            pre.classList.add('prism');
        });
}
