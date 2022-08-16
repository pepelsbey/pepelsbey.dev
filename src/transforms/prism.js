module.exports = function (window, content) {
    const articleContent = window.document.querySelector('.main__content');

    if (!articleContent) {
        return;
    }

    const pres = articleContent.querySelectorAll('pre');

    [...pres]
        .forEach((pre) => {
            pre.classList.add('prism');
        });
}
