import { execSync } from 'node:child_process';

const days = parseInt(process.argv[2]) || 7;
const stats = [];

// ANSI colors
const dim = '\x1b[2m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

const dateFormat = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
});

// Collect stats for the last N days
for (let i = 0; i < days; i++) {
	const date = new Date();
	date.setDate(date.getDate() - i);
	const key = `daily:${date.toISOString().split('T')[0]}`;

	try {
		const output = execSync(`netlify blobs:get feed ${key}`, {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		const data = JSON.parse(output);
		stats.unshift(data);
	} catch {
		stats.unshift({ date: date.toISOString().split('T')[0], totalRequests: 0, clients: [] });
	}
}

// Check if UA is a service (reports subscriber count)
function isService(ua) {
	return /\d+\s*subscribers?/i.test(ua);
}

// Parse subscriber count from user agent
function getSubscribers(ua) {
	const match = ua.match(/(\d+)\s*subscribers?/i);
	return match ? parseInt(match[1]) : 1;
}

// Calculate subscribers per day
function getDaySubscribers(day) {
	const serviceSubscribers = {};
	const individualSubscribers = {};

	for (const client of day.clients || []) {
		if (isService(client.ua)) {
			// Services: group by UA, take max subscribers
			const subs = getSubscribers(client.ua);
			serviceSubscribers[client.ua] = Math.max(serviceSubscribers[client.ua] || 0, subs);
		} else {
			// Individuals: group by IP, count as 1
			individualSubscribers[client.ip] = 1;
		}
	}

	const fromServices = Object.values(serviceSubscribers).reduce((a, b) => a + b, 0);
	const fromIndividuals = Object.values(individualSubscribers).reduce((a, b) => a + b, 0);

	return fromServices + fromIndividuals;
}

// Add subscriber count to each day
for (const day of stats) {
	day.subscribers = getDaySubscribers(day);
}

// Find max for scaling
const maxSubscribers = Math.max(...stats.map((s) => s.subscribers), 1);
const barWidth = 40;

console.log('RSS feed subscribers\n');

for (const day of stats) {
	const filled = Math.round((day.subscribers / maxSubscribers) * barWidth);
	const bar = `${green}${'█'.repeat(filled)}${reset}${dim}${'░'.repeat(barWidth - filled)}${reset}`;
	const label = `${dim}${dateFormat.format(new Date(day.date))}${reset}`.padEnd(6 + dim.length + reset.length);
	console.log(`${label} ${bar} ${day.subscribers}`);
}

console.log();
