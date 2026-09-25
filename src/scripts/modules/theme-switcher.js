import { applyScheme, clearScheme, getSavedScheme, saveScheme } from './scheme.js';

const themeSwitcher = document.querySelector('.theme-switcher');
const themeButtons = document.querySelectorAll('.theme-switcher__button');

function setupSwitcher() {
	const savedScheme = getSavedScheme();

	if (savedScheme !== null) {
		const currentButton = document.querySelector(`.theme-switcher__button[value=${savedScheme}]`);

		pressButton(currentButton, true);
	}

	themeSwitcher.addEventListener('click', (event) => {
		const isButton = event.target.tagName === 'BUTTON';
		const isPressed = event.target.getAttribute('aria-pressed') === 'true';

		if (!isButton || isPressed) return;

		pressButton(event.target, true);
		setScheme(event.target.value);
	});
}

function pressButton(button, press) {
	for (let button of themeButtons) {
		button.setAttribute('aria-pressed', !press);
	}

	button.setAttribute('aria-pressed', press);
}

function setScheme(scheme) {
	applyScheme(scheme);

	if (scheme === 'auto') {
		clearScheme();
	} else {
		saveScheme(scheme);
	}
}

setupSwitcher();
