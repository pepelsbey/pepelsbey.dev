const autoprefixer = require('autoprefixer');
const csso = require('postcss-csso');
const esbuild = require('esbuild');
const fs = require('fs');
const htmlmin = require('html-minifier');
const markdown = require('markdown-it')({ html: true });
const minmax = require('postcss-media-minmax');
const pimport = require('postcss-import');
const postcss = require('postcss');
const prettydata = require('pretty-data');
const rss = require('@11ty/eleventy-plugin-rss');
const yaml = require('js-yaml');

const global = yaml.load(
    fs.readFileSync('src/data/global.yml', 'utf8')
);

module.exports = (config) => {
    // Collections

    const collections = {
        'articles': 'src/articles/*/index.md',
        'pages': 'src/pages/*.md',
    };

    config.addCollection('articles', (collectionApi) => {
        return collectionApi.getFilteredByGlob(
            collections.articles
        );
    })

    config.addCollection('sitemap', (collectionApi) => {
        return collectionApi.getFilteredByGlob([
            collections.articles,
            collections.pages,
        ]);
    })

    // Markdown

    config.addFilter('markdown', (value) => {
        return markdown.render(value);
    });

    config.addFilter('markdownInline', (value) => {
        return markdown.renderInline(value);
    });

    // HTML minification

    config.addTransform('htmlmin', (content, outputPath) => {
        if (outputPath && outputPath.endsWith('.html')) {
            const result = htmlmin.minify(
                content, {
                    removeComments: true,
                    collapseWhitespace: true
                }
            );

            return result;
        }

        return content;
    });

    // CSS build

    const styles = [
        './src/styles/index.css',
        './src/styles/light.css',
        './src/styles/dark.css',
    ];

    config.addTemplateFormats('css');

    config.addExtension('css', {
        outputFileExtension: 'css',
        compile: async (inputContent, inputPath) => {
            if (!styles.includes(inputPath)) {
                return;
            }

            return async () => {
                let output = await postcss([
                    pimport,
                    minmax,
                    autoprefixer,
                    csso
                ]).process(inputContent, { from: inputPath });

                return output.css;
            }
        }
    });

    // JavaScript

    config.addTemplateFormats('js');

    config.addExtension('js', {
        outputFileExtension: 'js',
        compile: async (content, inputPath) => {
            if (inputPath !== './src/scripts/index.js') {
                return;
            }

            return async () => {
                let output = await esbuild.buildSync({
                    entryPoints: [inputPath],
                    minify: true,
                    bundle: true,
                    write: false,
                }).outputFiles[0].text;

                return output;
            }
        }
    });

    // XML minification

    config.addTransform('xmlmin', (content, outputPath) => {
        if (outputPath && outputPath.endsWith('.xml')) {
            return prettydata.pd.xmlmin(content);
        }

        return content;
    });

    // YAML

    config.addDataExtension('yml', (contents) => {
        return yaml.load(contents);
    });

    // Absolute links

    config.addFilter('absolute', (post) => {
        const reg = /(src="[^(https:\/\/)])|(src="\/)|(href="[^(https:\/\/)])|(href="\/)/g;
        const prefix = global.domain + post.url;
        return post.templateContent.replace(reg, (match) => {
            if (match === 'src="/' || match === 'href="/') {
                match = match.slice(0, -1);
                return match + prefix;
            } else {
                return match.slice(0, -1) + prefix + match.slice(-1);
            }
        });
    });

    // Dates

    config.addFilter('dateLong', (value) => {
        return value.toLocaleString('en', {
            dateStyle: 'long',
        });
    })

    config.addFilter('dateShort', (value) => {
        return value.toLocaleString('en', {
            month: 'long',
            day: 'numeric',
        });
    })

    config.addFilter('dateISO', (value) => {
        return value.toISOString().split('T')[0];
    })

    // Passthrough copy

    copyPaths = [
        'src/robots.txt',
        'src/images',
        'src/fonts',
        'src/articles/**/*.!(md)',
    ];

    copyPaths.forEach(
        path => config.addPassthroughCopy(path)
    );

    // Plugins

    config.addPlugin(rss);

    // Config

    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data'
        },
        dataTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk',
        htmlTemplateEngine: 'njk',
        templateFormats: [
            'md', 'njk'
        ],
    };
};
