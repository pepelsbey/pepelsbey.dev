import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(__dirname, '..', '.cache');
const cacheFile = join(cacheDir, 'feed.json');

const startDate = new Date(2025, 11, 12);
const argument = process.argv[2];
const days = argument === 'all'
	? Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
	: parseInt(argument) || 7;
const stats = [];

// ANSI colors
const dim = '\x1b[2m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

const dateFormat = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
});

// Load cache
function loadCache() {
	try {
		if (existsSync(cacheFile)) {
			return JSON.parse(readFileSync(cacheFile, 'utf-8'));
		}
	} catch {
		// Ignore cache errors
	}
	return {};
}

// Save cache
function saveCache(cache) {
	try {
		if (!existsSync(cacheDir)) {
			mkdirSync(cacheDir, { recursive: true });
		}
		writeFileSync(cacheFile, JSON.stringify(cache, null, '\t'));
	} catch {
		// Ignore cache errors
	}
}

const cache = loadCache();
const today = new Date().toISOString().split('T')[0];

// Count how many days need fetching
let toFetch = 0;
for (let i = 0; i < days; i++) {
	const date = new Date();
	date.setDate(date.getDate() - i);
	const dateKey = date.toISOString().split('T')[0];
	const isToday = dateKey === today;
	if (isToday || !cache[dateKey]) {
		toFetch++;
	}
}

let fetched = 0;

// Collect stats for the last N days
for (let i = 0; i < days; i++) {
	const date = new Date();
	date.setDate(date.getDate() - i);
	const dateKey = date.toISOString().split('T')[0];
	const blobKey = `daily:${dateKey}`;
	const isToday = dateKey === today;

	// Use cache for past days, always fetch today
	if (!isToday && cache[dateKey]) {
		stats.unshift(cache[dateKey]);
		continue;
	}

	// Show progress when fetching multiple days
	if (toFetch > 1) {
		fetched++;
		process.stdout.write(`\rFetching stats: ${fetched}/${toFetch}`);
	}

	try {
		const output = execSync(`netlify blobs:get feed ${blobKey}`, {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		const data = JSON.parse(output);
		stats.unshift(data);

		cache[dateKey] = data;
	} catch {
		stats.unshift({ date: dateKey, totalRequests: 0, clients: [] });
	}
}

// Clear progress line
if (toFetch > 1) {
	process.stdout.write('\r' + ' '.repeat(30) + '\r');
}

// Save updated cache
saveCache(cache);

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