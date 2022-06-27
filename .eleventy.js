const autoprefixer = require('autoprefixer');
const csso = require('postcss-csso');
const esbuild = require('esbuild');
const htmlmin = require('html-minifier');
const pimport = require('postcss-import');
const postcss = require('postcss');
const prettydata = require('pretty-data');

const data = require('./src/data/data.js');

module.exports = (config) => {
    // Collections

    config.addCollection('blog', (collectionApi) => {
        return collectionApi.getFilteredByGlob('src/blog/*/index.md');
    })

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

    config.addTemplateFormats('css');

    config.addExtension('css', {
        outputFileExtension: 'css',
        compile: async (inputContent, inputPath) => {
            if (inputPath !== './src/styles/index.css') {
                return;
            }

            return async () => {
                let output = await postcss([
                    pimport,
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

    // Absolute links

    config.addFilter('absolute', (post) => {
        const reg = /(src="[^(https:\/\/)])|(src="\/)|(href="[^(https:\/\/)])|(href="\/)/g;
        const prefix = data.domain + post.url;
        return post.templateContent.replace(reg, (match) => {
            if (match === 'src="/' || match === 'href="/') {
                match = match.slice(0, -1);
                return match + prefix;
            } else {
                return match.slice(0, -1) + prefix + match.slice(-1);
            }
        });
    });

    config.addFilter('date', (value) => {
        return value.toLocaleString('en', {
            dateStyle: 'long',
        });
    })

    // Passthrough copy

    config.addPassthroughCopy('src/images');
    config.addPassthroughCopy('src/blog/**/*.!(md)');

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
