function getSelectionTextContent() {
	const selection = document.getSelection();
	const range = selection?.getRangeAt(0);
	const clone = range?.cloneContents();
	return clone?.textContent;
}

document.querySelector('.lead__title')?.addEventListener('copy', (event) => {
	const selectionText = getSelectionTextContent();
	event.clipboardData.setData(
		'text/plain',
		selectionText ?? event.target.textContent
	);

	event.preventDefault();
});
