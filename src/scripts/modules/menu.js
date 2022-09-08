import { createFocusTrap } from 'focus-trap';

const page = document.documentElement;
const header = document.querySelector('.header');
const headerButton = document.querySelector('.header__button');
const headerLink = document.querySelector('.header__link');
const menu = document.querySelector('.menu');
const menuList = document.querySelector('.menu__list');
const menuFeed = document.querySelector('.menu__feed');
const mobileCheck = matchMedia('(max-width: 1023px)');
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

function updateMenu(mobile) {
    if (mobile) {
        menuFeed.after(menuList);
    } else {
        menuFeed.before(menuList);
        focusTrap.deactivate();
        headerLink.setAttribute('tabindex', '0');
    }
}

mobileCheck.addEventListener('change', (event) => {
    if (event.matches) {
        updateMenu(true);
    } else {
        updateMenu(false);
    }
});

if (mobileCheck.matches) {
    updateMenu(true);
}
