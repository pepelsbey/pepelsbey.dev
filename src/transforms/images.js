import { promises as fsp } from 'fs';
import Image from '@11ty/eleventy-img';
import os from 'os';
import path from 'path';
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
	sharpAvifOptions: {
		lossless: true,
	},
	sharpWebpOptions: {
		lossless: true,
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

	let imagePath = image.src.split('/');

	imagePath.splice(-1);

	const imagesSourcePrefix = imagePath.join('/');

	imagePath.unshift(imagesOutputPrefix);

	const imagesOutputPath = imagePath.join('/');

	try {
		await fsp.stat(originalLink);
	} catch (error) {
		console.warn(`Image ${originalLink} does not exist. ${error}`);
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

	const options = {
		urlPath: imagesSourcePrefix,
		outputDir: cacheOutputPath,
		widths: [...baseConfig.widths, originalWidth],
		formats: [...baseConfig.formats, ext],
		filenameFormat: baseConfig.filenameFormat,
		sharpWebpOptions: sharpWebpOptions[ext] ? sharpWebpOptions[ext] : sharpWebpOptions.default,
		sharpAvifOptions: sharpAvifOptions[ext] ? sharpAvifOptions[ext] : sharpAvifOptions.default,
	};

	const imageAttributes = Object.fromEntries(
		[...image.attributes].map((attr) => [attr.name, attr.value])
	);

	imageAttributes.sizes = imageAttributes.sizes || baseConfig.sizes;

	const metadata = Image.statsSync(originalLink, options);
	const imageHTML = Image.generateHTML(metadata, imageAttributes);
	const tempElement = window.document.createElement('div');

	tempElement.innerHTML = imageHTML;

	image.replaceWith(tempElement.firstElementChild);

	Image(originalLink, options);
}
