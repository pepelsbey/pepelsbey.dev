import { createFocusTrap } from 'focus-trap';

const page = document.documentElement;
const header = document.querySelector('.header');
const headerButton = document.querySelector('.header__button');
const headerLink = document.querySelector('.header__link');
const menu = document.querySelector('.menu');
const focusTrap = createFocusTrap(header);

function isMenuOpen() {
    return headerButton.getAttribute('aria-expanded') === 'true';
}

function toggleMenu() {
    const isOpen = isMenuOpen();

    headerButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    headerLink.setAttribute('tabindex', isOpen ? '0' : '-1');

    if (isOpen) {
        menu.classList.remove('menu--open');
        menu.addEventListener('transitionend', () => {
            menu.classList.add('menu--closed');
        }, {
            once: true
        });
        focusTrap.deactivate();
    } else {
        menu.classList.remove('menu--closed');
        setTimeout(() => menu.classList.add('menu--open'), 20);
        focusTrap.activate();
    }

    page.classList.toggle('page--clip');
}

headerButton.addEventListener('click', toggleMenu);

document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
        toggleMenu(false);
    }
});
