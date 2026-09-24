const fence = /^\s{0,3}(`{3,}|~{3,})/;
const heading = /^(#{2,3})\s+(.+?)(?:\s+#+)?\s*$/;

const parseToc = (markdown) => {
	const toc = [];
	let openFence = null;

	for (const line of markdown.split('\n')) {
		const fenceMatch = line.match(fence);

		if (fenceMatch) {
			const marker = fenceMatch[1][0];

			if (openFence === null) {
				openFence = marker;
			} else if (openFence === marker) {
				openFence = null;
			}

			continue;
		}

		if (openFence !== null) {
			continue;
		}

		const headingMatch = line.match(heading);

		if (!headingMatch) {
			continue;
		}

		const [, level, title] = headingMatch;
		const parent = toc.at(-1);

		if (level.length === 2 || !parent) {
			toc.push({ title });
		} else {
			parent.items ??= [];
			parent.items.push(title);
		}
	}

	return toc;
};

export default {
	toc: ({ page }) => {
		if (!page.inputPath.endsWith('.md')) {
			return;
		}

		return parseToc(page.rawInput);
	},
};
