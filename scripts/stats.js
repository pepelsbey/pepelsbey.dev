import { execSync } from 'node:child_process';

const days = parseInt(process.argv[2]) || 7;
const stats = [];

// ANSI colors
const dim = '\x1b[2m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

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
		stats.unshift({ date: date.toISOString().split('T')[0], totalRequests: 0, userAgents: {} });
	}
}

// Parse subscriber count from user agent
function getSubscribers(agent) {
	const match = agent.match(/(\d+)\s*subscribers?/i);
	return match ? parseInt(match[1]) : 1;
}

// Calculate subscribers per day (unique agents, max subscriber count)
function getDaySubscribers(day) {
	const agentSubs = {};
	for (const agent of Object.keys(day.userAgents)) {
		const subs = getSubscribers(agent);
		agentSubs[agent] = Math.max(agentSubs[agent] || 0, subs);
	}
	return Object.values(agentSubs).reduce((a, b) => a + b, 0);
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
	const d = new Date(day.date);
	const date = `${dim}${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}${reset}`.padEnd(6 + dim.length + reset.length);
	console.log(`${date} ${bar} ${day.subscribers}`);
}

console.log();
