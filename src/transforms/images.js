import { promises as fsp } from 'node:fs';
import Image from '@11ty/eleventy-img';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

Image.concurrency = os.cpus().length;

const cache = '.cache/images';

const baseConfig = {
	extBlackList: ['svg'],
	widths: [640, 960, 1280, 1920, 2560],
	sizes: [
		'(min-width: 1760px) 828px',
		'(min-width: 1024) calc(75vw - 20px - 2 * 42px)',
		'calc(100vw - 2 * 20px)',
	].join(', '),
	formats: [
		'avif',
		'webp',
	],
	filenameFormat: (id, src, width, format) => {
		const extension = path.extname(src);
		const name = path.basename(src, extension);
		return `${name}-${width}.${format}`;
	},
}

const sharpAvifOptions = {
	default: {
		lossless: true,
	},
	get png() {
		return this.default
	},
	jpg: {
		quality: 50,
	},
	get jpeg() {
		return this.jpg
	},
};

const sharpWebpOptions = {
	default: {
		lossless: true,
	},
	get png() {
		return this.default
	},
	jpg: {
		quality: 80,
	},
	get jpeg() {
		return this.jpg
	},
};

const colorSchemePattern = /@(light|dark)(?=\.)/;

async function fileExists(filePath) {
	try {
		await fsp.stat(filePath);
		return true;
	} catch {
		return false;
	}
}

function getColorSchemeInfo(src) {
	const match = src.match(colorSchemePattern);
	if (!match) return null;

	const scheme = match[1];
	const altScheme = scheme === 'light' ? 'dark' : 'light';
	const altSrc = src.replace(`@${scheme}`, `@${altScheme}`);

	return { scheme, altScheme, altSrc };
}

function getImageOptions(imagesSourcePrefix, cacheOutputPath, ext, originalWidth) {
	return {
		urlPath: imagesSourcePrefix,
		outputDir: cacheOutputPath,
		widths: [...baseConfig.widths, originalWidth],
		formats: [...baseConfig.formats, ext],
		filenameFormat: baseConfig.filenameFormat,
		sharpWebpOptions: sharpWebpOptions[ext] ? sharpWebpOptions[ext] : sharpWebpOptions.default,
		sharpAvifOptions: sharpAvifOptions[ext] ? sharpAvifOptions[ext] : sharpAvifOptions.default,
	};
}

function buildColorSchemePicture(lightMetadata, darkMetadata, imageAttributes, window) {
	// Let eleventy-img handle the light (default) picture as usual
	const lightHTML = Image.generateHTML(lightMetadata, imageAttributes);
	const temp = window.document.createElement('div');
	temp.innerHTML = lightHTML;
	const picture = temp.firstElementChild;

	// Build dark <source> elements and prepend them
	const formats = Object.keys(darkMetadata);
	const darkSources = formats.map((format) => {
		const entries = darkMetadata[format];
		const source = window.document.createElement('source');
		source.setAttribute('media', '(prefers-color-scheme: dark)');
		source.setAttribute('srcset', entries.map((e) => e.srcset).join(', '));
		source.setAttribute('sizes', imageAttributes.sizes);
		if (entries[0].sourceType) {
			source.setAttribute('type', entries[0].sourceType);
		}
		return source;
	});

	for (const source of darkSources.reverse()) {
		picture.prepend(source);
	}

	return picture;
}

export default function (window, content, outputPath) {
	const articleContainer = window.document.getElementById('article-content');

	if (!articleContainer) return;

	const baseSourcePath = outputPath.replace('dist/', '').replace('/index.html', '');
	const imagesSourcePath = path.join('src', baseSourcePath);
	const imagesOutputPrefix = path.join('dist', baseSourcePath);

	const images = Array.from(articleContainer.querySelectorAll('img'));

	return Promise.all(
		images.map((image) => buildImage(
			image,
			imagesSourcePath,
			imagesOutputPrefix,
			window,
		))
	);
}

async function buildImage(image, imagesSourcePath, imagesOutputPrefix, window) {
	const originalLink = path.join(
		imagesSourcePath,
		image.src
	);

	const imagesSourcePrefix = path.dirname(image.src);
	const imagesOutputPath = path.join(imagesOutputPrefix, imagesSourcePrefix);

	if (!await fileExists(originalLink)) {
		console.warn(`Image ${originalLink} does not exist.`);
		return;
	}

	const ext = path.extname(originalLink).replace('.', '');

	if (baseConfig.extBlackList.includes(ext)) {
		return;
	}

	const { width: originalWidth } = await sharp(originalLink).metadata();

	const cacheOutputPath = path.join(
		cache, imagesOutputPath.replace('dist/', '')
	);

	const options = getImageOptions(imagesSourcePrefix, cacheOutputPath, ext, originalWidth);

	const imageAttributes = Object.fromEntries(
		[...image.attributes].map((attr) => [attr.name, attr.value])
	);

	imageAttributes.sizes = imageAttributes.sizes || baseConfig.sizes;

	// Check for color scheme variant
	const schemeInfo = getColorSchemeInfo(image.src);

	if (schemeInfo) {
		const altOriginalLink = path.join(imagesSourcePath, schemeInfo.altSrc);

		if (await fileExists(altOriginalLink)) {
			const { width: altOriginalWidth } = await sharp(altOriginalLink).metadata();
			const altOptions = getImageOptions(imagesSourcePrefix, cacheOutputPath, ext, altOriginalWidth);

			const metadata = Image.statsSync(originalLink, options);
			const altMetadata = Image.statsSync(altOriginalLink, altOptions);

			// Light is always default, dark uses media query
			const isLight = schemeInfo.scheme === 'light';
			const [lightMetadata, darkMetadata] = isLight ? [metadata, altMetadata] : [altMetadata, metadata];
			const [lightLink, darkLink] = isLight ? [originalLink, altOriginalLink] : [altOriginalLink, originalLink];
			const [lightOptions, darkOptions] = isLight ? [options, altOptions] : [altOptions, options];

			const picture = buildColorSchemePicture(
				lightMetadata,
				darkMetadata,
				imageAttributes,
				window,
			);

			image.replaceWith(picture);

			// Trigger actual image generation for both variants
			Image(lightLink, lightOptions);
			Image(darkLink, darkOptions);

			return;
		}

		console.warn(`Color scheme variant ${altOriginalLink} does not exist, falling back to single image.`);
	}

	// Default: single image, no color scheme
	const metadata = Image.statsSync(originalLink, options);
	const imageHTML = Image.generateHTML(metadata, imageAttributes);
	const tempElement = window.document.createElement('div');

	tempElement.innerHTML = imageHTML;

	image.replaceWith(tempElement.firstElementChild);

	Image(originalLink, options);
}
