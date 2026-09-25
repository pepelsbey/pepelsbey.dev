import { parseHTML } from 'linkedom';
import slugify from '@sindresorhus/slugify';
import * as esbuild from 'esbuild';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import minifyHtml from '@minify-html/node';
import markdownIt from 'markdown-it';
import { bundle as lightningcssBundle, browserslistToTargets, Features } from 'lightningcss';
import { pd as prettyData } from 'pretty-data';
import removeMarkdown from 'remove-markdown';
import rss from '@11ty/eleventy-plugin-rss';
import { load as yamlLoad } from 'js-yaml';
import { getExternalLanguages, normalizeLanguage } from 'microlighter/grammar-dependencies.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { cp } from 'node:fs/promises';
import { basename } from 'node:path';

import anchors from './src/transforms/anchors.js';
import demos from './src/transforms/demos.js';
import figure from './src/transforms/figure.js';
import images from './src/transforms/images.js';
import { languageAliases } from './src/scripts/modules/languages.js';

import packageJson from './package.json' with { type: 'json' };

const markdown = new markdownIt({ html: true });

markdown.renderer.rules.fence = (tokens, index) => {
	const { content, info } = tokens[index];
	const language = info.trim().split(/\s+/)[0];
	const languageClass = language
		? ` class="language-${markdown.utils.escapeHtml(language)}"`
		: '';

	return `<pre class="code"><code${languageClass}>${markdown.utils.escapeHtml(content)}</code></pre>`;
};

// Bundle only MicroLighter grammar that articles use

const grammarStub = (grammars) => ({
	name: 'grammar-stub',
	setup(build) {
		build.onLoad({ filter: /\/microlighter\/dist\/grammars\/[^/]+\.js$/ }, ({ path }) => {
			if (grammars.has(basename(path, '.js'))) {
				return;
			}

			return { contents: 'export default null;' };
		});
	},
});

export default (config) => {
	// Collections

	const collections = {
		articles: 'src/articles/*/index.md',
		pages: 'src/pages/!(404)/index.njk',
	};

	config.addCollection('articles', (collectionApi) => {
		return collectionApi.getFilteredByGlob(collections.articles);
	});

	config.addCollection('sitemap', (collectionApi) => {
		return collectionApi.getFilteredByGlob([
			collections.articles,
			collections.pages,
		]);
	});

	// Markdown

	config.addFilter('markdown', (value) => {
		return markdown.render(value);
	});

	config.addFilter('markdownInline', (value) => {
		return markdown.renderInline(value);
	});

	config.addFilter('markdownRemove', (value) => {
		return removeMarkdown(value);
	});

	config.setLibrary('md', markdown);

	config.addFilter('anchor', (value) => {
		return slugify(value, { decamelize: false }).toLowerCase();
	});

	// HTML

	config.addTransform('html-minify', async (content, path) => {
		if (path && path.endsWith('.html')) {
			return minifyHtml.minify(Buffer.from(content), {
				keep_closing_tags: true,
				keep_html_and_head_opening_tags: true,
				keep_spaces_between_attributes: true,
			}).toString();
		}

		return content;
	});

	const htmlTransforms = [
		anchors,
		demos,
		figure,
		images,
	];

	config.addTransform('html-transform', async (content, path) => {
		if (path && path.endsWith('.html')) {
			const window = parseHTML(content);

			for (const transform of htmlTransforms) {
				await transform(window, content, path);
			}

			return window.document.toString();
		}

		return content;
	});

	// CSS

	const styles = [
		'./src/styles/index.css',
	];

	const processStyles = async (path) => {
		return await lightningcssBundle({
			filename: path,
			minify: true,
			sourceMap: false,
			targets: browserslistToTargets(packageJson.browserslist),
			include: Features.MediaQueries | Features.Nesting,
			exclude: Features.LightDark,
		});
	};

	config.addTemplateFormats('css');

	config.addExtension('css', {
		outputFileExtension: 'css',
		compile: async (content, path) => {
			if (!styles.includes(path)) {
				return;
			}

			return async () => {
				let { code } = await processStyles(path);

				return code;
			};
		},
	});

	config.addFilter('css', async (path) => {
		let { code } = await processStyles(path);

		return code;
	});

	// JavaScript

	const collectGrammars = async () => {
		const fences = /^[\t ]*(?:`{3,}|~{3,})([^\s`]+)/gm;
		const visited = new Set();
		const grammars = new Set();

		const addGrammar = async (language) => {
			const name = normalizeLanguage(language, languageAliases);

			if (visited.has(name)) {
				return;
			}

			visited.add(name);

			let grammar;

			try {
				({ default: grammar } = await import(`microlighter/grammars/${name}.js`));
			} catch {
				return;
			}

			grammars.add(name);

			await Promise.all([...getExternalLanguages(grammar)].map(addGrammar));
		};

		const languages = fs.globSync(collections.articles)
			.flatMap((file) => [...fs.readFileSync(file, 'utf8').matchAll(fences)])
			.map(([, language]) => language);

		await Promise.all(languages.map(addGrammar));

		return grammars;
	};

	const scripts = [
		'./src/scripts/index.js',
		'./src/scripts/color-scheme.js',
	];

	config.addTemplateFormats('js');

	config.addExtension('js', {
		outputFileExtension: 'js',
		compile: async (content, path) => {
			if (!scripts.includes(path)) {
				return;
			}

			return async () => {
				let { outputFiles } = await esbuild.build({
					target: browserslistToEsbuild(packageJson.browserslist),
					entryPoints: [path],
					minify: true,
					bundle: true,
					write: false,
					plugins: [grammarStub(await collectGrammars())],
				});

				return outputFiles[0].text;
			};
		},
	});

	// XML minification

	config.addTransform('xmlMin', (content, path) => {
		if (path && path.endsWith('.xml')) {
			return prettyData.xmlmin(content);
		}

		return content;
	});

	// YAML

	config.addDataExtension('yml', (contents) => {
		return yamlLoad(contents);
	});

	// Dates

	config.addFilter('lastModified', (filePath) => {
		try {
			const lastModified = execSync(`git log -1 --format=%cd --date=iso ${filePath}`).toString().trim();
			if (!lastModified) {
				const stats = fs.statSync(filePath);
				return stats.mtime;
			}
			return new Date(lastModified);
		} catch (error) {
			console.error(error);
			const stats = fs.statSync(filePath);
			return stats.mtime;
		}
	});

	config.addFilter('dateLong', (value) => {
		return new Date(value).toLocaleString('en', {
			dateStyle: 'long',
		});
	});

	config.addFilter('dateShort', (value) => {
		const date = new Date(value);
		const articleYear = date.getFullYear();
		const currentYear = new Date().getFullYear();
		const dateFormat = articleYear < currentYear
			? {
				dateStyle: 'long',
			}
			: {
				month: 'long',
				day: 'numeric',
			};

		return date.toLocaleString('en', dateFormat);
	});

	config.addFilter('dateISO', (value) => {
		return new Date(value).toISOString().split('T')[0];
	});

	// Passthrough copy

	[
		'src/apple-touch-icon.png',
		'src/favicon.ico',
		'src/fonts',
		'src/images',
		'src/robots.txt',
		'src/articles/**/*.!(md|yml)',
		'src/talks',
	].forEach((path) => config.addPassthroughCopy(path));

	// Copy cached images to dist

	config.on('eleventy.after', async () => {
		const cacheDir = '.cache/images';
		if (fs.existsSync(cacheDir)) {
			await cp(cacheDir, 'dist', { recursive: true });
		}
	});

	// Plugins

	config.addPlugin(rss);

	// Config

	return {
		dir: {
			input: 'src',
			output: 'dist',
			includes: 'includes',
			layouts: 'layouts',
			data: 'data',
		},
		dataTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		templateFormats: ['md', 'njk'],
	};
};
