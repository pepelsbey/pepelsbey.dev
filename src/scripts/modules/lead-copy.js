document.querySelector('.lead__title').addEventListener('copy', (event) => {
	event.clipboardData.setData(
		'text/plain',
		event.target.textContent
	);

	event.preventDefault();
});
