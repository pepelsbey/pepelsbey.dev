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

    page.classList.toggle('page--clip');
    headerButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    headerLink.setAttribute('tabindex', isOpen ? '0' : '-1');

    if (isOpen) {
        menu.classList.toggle('menu--open');
    } else {
        menu.toggleAttribute('hidden');
        setTimeout(() => menu.classList.toggle('menu--open'), 0);
    }

    if (isOpen) {
        focusTrap.deactivate();
    } else {
        focusTrap.activate();
    }
}

menu.addEventListener('transitionend', () => {
    if (!isMenuOpen()) {
        menu.toggleAttribute('hidden');
    }
});

headerButton.addEventListener('click', toggleMenu);

document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
        toggleMenu(false);
    }
});
