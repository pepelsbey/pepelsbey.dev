import { getStore } from '@netlify/blobs';

export default async function handler(request, context) {
	const response = await context.next();

	// Track asynchronously to not delay the response
	context.waitUntil(trackRequest(request));

	return response;
}

async function trackRequest(request) {
	try {
		const store = getStore('feed');
		const today = new Date().toISOString().split('T')[0];
		const userAgent = request.headers.get('user-agent') || 'unknown';

		// Get current daily stats
		const dailyKey = `daily:${today}`;
		const existingData = await store.get(dailyKey, { type: 'json' });

		const stats = existingData || {
			date: today,
			totalRequests: 0,
			userAgents: {},
		};

		// Increment counters
		stats.totalRequests++;

		// Track user agent (truncate to first 100 chars for storage)
		const agentKey = userAgent.slice(0, 100);
		stats.userAgents[agentKey] = (stats.userAgents[agentKey] || 0) + 1;

		await store.setJSON(dailyKey, stats);

		// Also update all-time counter
		const allTimeData = await store.get('all-time', { type: 'json' });
		const allTime = allTimeData || { totalRequests: 0 };
		allTime.totalRequests++;
		await store.setJSON('all-time', allTime);
	} catch (error) {
		console.error('Feed tracking error:', error);
	}
}

export const config = {
	path: '/feed/',
};
