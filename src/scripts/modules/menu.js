const menu = document.querySelector('.menu');
const headerButton = document.querySelector('.header__button');
const menuButton = document.querySelector('.menu__button');

headerButton.addEventListener('click', (event) => {
    menu.removeAttribute('hidden');
});

menuButton.addEventListener('click', (event) => {
    menu.setAttribute('hidden', '');
});
