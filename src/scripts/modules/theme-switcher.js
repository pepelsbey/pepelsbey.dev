const themeSwitcher = document.querySelector('.theme-switcher');
const themeButtons = document.querySelectorAll('.theme-switcher__button');

themeSwitcher.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        for (let button of themeButtons) {
            button.setAttribute('aria-pressed', 'false');
        }

        event.target.setAttribute('aria-pressed', 'true');
    }
});
