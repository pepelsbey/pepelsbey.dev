module.exports = function(window) {
    const content = window.document.getElementById('article-content');

    if (!content) return;

    const pres = content.querySelectorAll('pre');

    [...pres]
        .forEach((pre) => {
            pre.classList.add('prism');
        });
}
