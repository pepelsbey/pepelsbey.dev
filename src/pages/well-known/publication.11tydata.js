// Only emit the .well-known route once a publication rkey is configured
// by `npm run standard`. The path has no file extension on purpose —
// that’s what the standard.site spec calls for.
export default {
	eleventyExcludeFromCollections: true,
	eleventyAllowMissingExtension: true,
	eleventyComputed: {
		permalink: (data) =>
			data.standard?.config?.enabled && data.standard?.config?.publication?.rkey
				? '/.well-known/site.standard.publication'
				: false,
	},
};
