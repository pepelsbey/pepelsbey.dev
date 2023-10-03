const lightStyle = document.querySelector('style[media*=prefers-color-scheme][media*=light]');
const darkStyle = document.querySelector('style[media*=prefers-color-scheme][media*=dark]');
const lightTheme = document.querySelector('meta[name=theme-color][media*=prefers-color-scheme][media*=light]');
const darkTheme = document.querySelector('meta[name=theme-color][media*=prefers-color-scheme][media*=dark]');
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

function setupScheme() {
	const savedScheme = getSavedScheme();

	if (savedScheme === null) return;

	setScheme(savedScheme);
}

function setScheme(scheme) {
	switchMedia(scheme);

	if (scheme === 'auto') {
		clearScheme();
	} else {
		saveScheme(scheme);
	}
}

function switchMedia(scheme) {
	let lightMedia;
	let darkMedia;

	if (scheme === 'auto') {
		lightMedia = '(prefers-color-scheme: light)';
		darkMedia = '(prefers-color-scheme: dark)';
	} else {
		lightMedia = (scheme === 'light') ? 'all' : 'not all';
		darkMedia = (scheme === 'dark') ? 'all' : 'not all';
	}

	lightStyle.media = lightMedia;
	darkStyle.media = darkMedia;

	lightTheme.media = lightMedia;
	darkTheme.media = darkMedia;
}

function getSavedScheme() {
	return localStorage.getItem('color-scheme');
}

function saveScheme(scheme) {
	localStorage.setItem('color-scheme', scheme);
}

function clearScheme() {
	localStorage.removeItem('color-scheme');
}

setupSwitcher();
setupScheme();
