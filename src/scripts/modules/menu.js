import { createFocusTrap } from 'focus-trap';
// import wicg-inert from 'wicg-inert';

const header = document.querySelector('.header');
const menu = document.querySelector('.menu');
const headerButton = document.querySelector('.header__button');
const headerLink = document.querySelector('.header__link');
const focusTrap = createFocusTrap(header);

headerButton.addEventListener('click', () => {
    const isExpanded = headerButton.getAttribute('aria-expanded') === 'true';

    headerButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    headerLink.setAttribute('tabindex', isExpanded ? '0' : '-1');

    menu.toggleAttribute('hidden');

    if (isExpanded) {
        focusTrap.deactivate();
    } else {
        focusTrap.activate();
    }
});
