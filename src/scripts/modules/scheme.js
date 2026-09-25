const colorScheme = document.querySelector('meta[name=color-scheme]');
const [lightTheme, darkTheme] = document.querySelectorAll('meta[name=theme-color]');

export function getSavedScheme() {
	return localStorage.getItem('color-scheme');
}

export function saveScheme(scheme) {
	localStorage.setItem('color-scheme', scheme);
}

export function clearScheme() {
	localStorage.removeItem('color-scheme');
}

export function applyScheme(scheme) {
	let lightMedia;
	let darkMedia;

	if (scheme === 'auto') {
		lightMedia = '(prefers-color-scheme: light)';
		darkMedia = '(prefers-color-scheme: dark)';
	} else {
		lightMedia = (scheme === 'light') ? 'all' : 'not all';
		darkMedia = (scheme === 'dark') ? 'all' : 'not all';
	}

	colorScheme.content = (scheme === 'auto') ? 'light dark' : scheme;

	lightTheme.media = lightMedia;
	darkTheme.media = darkMedia;
}
