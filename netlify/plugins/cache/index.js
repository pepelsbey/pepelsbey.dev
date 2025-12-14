const cache = '.cache/images';

export default {
	async onPreBuild({ utils }) {
		if (await utils.cache.has(cache)) {
			await utils.cache.restore(cache);
			console.log(`Restored cache: ${cache}`);
		}
	},

	async onPostBuild({ utils }) {
		if (await utils.cache.save(cache)) {
			console.log(`Saved cache: ${cache}`);
		}
	},
};
