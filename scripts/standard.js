import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import Color from 'colorjs.io';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = join(root, '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);
const configPath = join(root, 'src/data/standard/config.yml');
const documentsPath = join(root, 'src/data/standard/documents.yml');
const articlesDir = join(root, 'src/articles');
const globalPath = join(root, 'src/data/global.yml');
const iconPath = join(root, 'src/images/logo/512.png');
const coverFilename = 'cover.png';

const publicationType = 'site.standard.publication';
const documentType = 'site.standard.document';
const themeBasicType = 'site.standard.theme.basic';
const themeColorType = 'site.standard.theme.color#rgb';

const identifier = process.env.ATPROTO_IDENTIFIER;
const password = process.env.ATPROTO_APP_PASSWORD;

if (!identifier || !password) {
	console.error(
		'Missing ATPROTO_IDENTIFIER or ATPROTO_APP_PASSWORD. ' +
			'Create an app password at https://bsky.app/settings/app-passwords.',
	);
	process.exit(1);
}

const config = yamlLoad(readFileSync(configPath, 'utf-8'));
const global = yamlLoad(readFileSync(globalPath, 'utf-8'));
const pds = config.pds.replace(/\/$/, '');

// Call an atproto XRPC method
async function xrpc(method, name, { body, query, token } = {}) {
	const url = new URL(`${pds}/xrpc/${name}`);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) url.searchParams.set(key, value);
		}
	}

	const headers = { 'content-type': 'application/json' };
	if (token) headers.authorization = `Bearer ${token}`;

	const response = await fetch(url, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});

	const text = await response.text();
	const data = text ? JSON.parse(text) : {};

	if (!response.ok) {
		throw new Error(`${name} failed: ${response.status} ${data.message || text}`);
	}
	return data;
}

// Log in with an app password and return the access token + DID
async function login() {
	const data = await xrpc('POST', 'com.atproto.server.createSession', {
		body: { identifier, password },
	});
	return { token: data.accessJwt, did: data.did };
}

// List every record in a collection, following pagination
async function listAllRecords(token, did, collection) {
	const records = [];
	let cursor;
	do {
		const data = await xrpc('GET', 'com.atproto.repo.listRecords', {
			token,
			query: { repo: did, collection, limit: 100, cursor },
		});
		records.push(...data.records);
		cursor = data.cursor;
	} while (cursor);
	return records;
}

function putRecord(token, did, collection, rkey, record) {
	return xrpc('POST', 'com.atproto.repo.putRecord', {
		token,
		body: { repo: did, collection, rkey, record },
	});
}

function createRecord(token, did, collection, record) {
	return xrpc('POST', 'com.atproto.repo.createRecord', {
		token,
		body: { repo: did, collection, record },
	});
}

function deleteRecord(token, did, collection, rkey) {
	return xrpc('POST', 'com.atproto.repo.deleteRecord', {
		token,
		body: { repo: did, collection, rkey },
	});
}

// Guess mime type from a file extension
function mimeFor(filePath) {
	const ext = extname(filePath).toLowerCase().slice(1);
	return {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		webp: 'image/webp',
		gif: 'image/gif',
	}[ext] || 'application/octet-stream';
}

// RFC 4648 base32, lowercase, no padding
function base32(bytes) {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
	let bits = 0;
	let value = 0;
	let output = '';
	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			output += alphabet[(value >>> (bits - 5)) & 0x1f];
			bits -= 5;
		}
	}
	if (bits > 0) output += alphabet[(value << (5 - bits)) & 0x1f];
	return output;
}

// Compute the AT Proto blob CID (CIDv1, raw codec, sha-256 multihash)
function computeBlobCid(bytes) {
	const hash = createHash('sha256').update(bytes).digest();
	// [version=1, codec=raw(0x55), multihash=sha256(0x12) + length(0x20) + hash]
	const cidBytes = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), hash]);
	return 'b' + base32(cidBytes);
}

// Upload raw bytes to the PDS and return the resulting blob object
async function uploadBlob(token, bytes, mimeType) {
	const url = new URL(`${pds}/xrpc/com.atproto.repo.uploadBlob`);
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'content-type': mimeType,
			authorization: `Bearer ${token}`,
		},
		body: bytes,
	});
	const data = await response.json();
	if (!response.ok) {
		throw new Error(`uploadBlob failed: ${response.status} ${data.message || ''}`);
	}
	return data.blob;
}

// Reuse an existing blob if the local file hashes to the same CID,
// otherwise upload it. Returns `null` if the file is missing.
async function ensureBlob(token, filePath, existingBlob) {
	if (!existsSync(filePath)) return null;
	const bytes = readFileSync(filePath);
	const cid = computeBlobCid(bytes);
	if (existingBlob?.ref?.$link === cid && existingBlob?.size === bytes.length) {
		return existingBlob;
	}
	return uploadBlob(token, bytes, mimeFor(filePath));
}

// Convert a CSS-style `H S% L%` string (matching `src/styles/colors`)
// into a typed RGB color value for the PDS record
function rgb(hsl) {
	const [r, g, b] = new Color(`hsl(${hsl})`).to('srgb').coords;
	return {
		$type: themeColorType,
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
}

// Shape the desired publication record from config
function buildPublicationRecord(icon) {
	const theme = config.publication.theme;
	const record = {
		$type: publicationType,
		url: global.domain,
		name: config.publication.name,
		description: config.publication.description,
		basicTheme: {
			$type: themeBasicType,
			accent: rgb(theme.accent),
			accentForeground: rgb(theme.accentForeground),
			background: rgb(theme.background),
			foreground: rgb(theme.foreground),
		},
		preferences: { showInDiscover: true },
	};
	if (icon) record.icon = icon;
	return record;
}

// Shape the desired document record for a single article
function buildDocumentRecord(publicationUri, article, coverImage) {
	const record = {
		$type: documentType,
		site: publicationUri,
		title: article.title,
		path: article.path,
		description: article.desc,
		publishedAt: new Date(article.date).toISOString(),
	};
	if (coverImage) record.coverImage = coverImage;
	return record;
}

// Canonical JSON: deeply sort object keys so field order doesn’t matter.
// The PDS returns records with a different key order than we send.
function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonical(value[key])]),
		);
	}
	return value;
}

function recordsEqual(a, b) {
	return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

// Read article front matter from `src/articles/*/index.yml`
function readArticles() {
	const slugs = readdirSync(articlesDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);

	const articles = [];
	for (const slug of slugs) {
		const ymlPath = join(articlesDir, slug, 'index.yml');
		if (!existsSync(ymlPath)) continue;
		const data = yamlLoad(readFileSync(ymlPath, 'utf-8'));
		// `permalink: false` means the article isn’t published on this site
		if (data.permalink === false) continue;
		articles.push({
			slug,
			title: data.title,
			desc: data.desc,
			date: data.date,
			path: `/articles/${slug}/`,
		});
	}
	return articles;
}

// Reconcile the publication record, returning its rkey
async function syncPublication(token, did) {
	const existing = await listAllRecords(token, did, publicationType);
	const icon = await ensureBlob(token, iconPath, existing[0]?.value?.icon);
	const record = buildPublicationRecord(icon);

	if (existing.length === 0) {
		const created = await createRecord(token, did, publicationType, record);
		const rkey = created.uri.split('/').pop();
		console.log(`publication: created ${rkey}`);
		return rkey;
	}

	// Use the first record; clean up any extras
	const [primary, ...extras] = existing;
	const rkey = primary.uri.split('/').pop();

	if (!recordsEqual(primary.value, record)) {
		await putRecord(token, did, publicationType, rkey, record);
		console.log(`publication: updated ${rkey}`);
	} else {
		console.log(`publication: up to date (${rkey})`);
	}

	for (const extra of extras) {
		const extraRkey = extra.uri.split('/').pop();
		await deleteRecord(token, did, publicationType, extraRkey);
		console.log(`publication: deleted stray ${extraRkey}`);
	}

	return rkey;
}

// Reconcile document records against the article manifest
async function syncDocuments(token, did, publicationRkey) {
	const publicationUri = `at://${did}/${publicationType}/${publicationRkey}`;
	const articles = readArticles();
	const existing = await listAllRecords(token, did, documentType);

	// Index existing records by their `path` field
	const byPath = new Map();
	const orphaned = [];
	for (const record of existing) {
		const recordPath = record.value?.path;
		if (recordPath && !byPath.has(recordPath)) {
			byPath.set(recordPath, record);
		} else {
			orphaned.push(record);
		}
	}

	const documents = {};
	const seenPaths = new Set();

	for (const article of articles) {
		seenPaths.add(article.path);
		const existingRecord = byPath.get(article.path);
		const coverPath = join(articlesDir, article.slug, coverFilename);
		const coverImage = await ensureBlob(token, coverPath, existingRecord?.value?.coverImage);
		const desired = buildDocumentRecord(publicationUri, article, coverImage);

		if (!existingRecord) {
			const created = await createRecord(token, did, documentType, desired);
			const rkey = created.uri.split('/').pop();
			documents[article.path] = rkey;
			console.log(`document: created ${article.path} → ${rkey}`);
			continue;
		}

		const rkey = existingRecord.uri.split('/').pop();
		documents[article.path] = rkey;

		if (!recordsEqual(existingRecord.value, desired)) {
			await putRecord(token, did, documentType, rkey, desired);
			console.log(`document: updated ${article.path} → ${rkey}`);
		} else {
			console.log(`document: up to date ${article.path} → ${rkey}`);
		}
	}

	// Delete records whose path no longer corresponds to a live article,
	// plus any duplicate orphans we found above
	const stale = existing.filter((record) => !seenPaths.has(record.value?.path));
	for (const record of [...stale, ...orphaned]) {
		const rkey = record.uri.split('/').pop();
		// Skip records we’re keeping by rkey
		if (Object.values(documents).includes(rkey)) continue;
		await deleteRecord(token, did, documentType, rkey);
		console.log(`document: deleted ${record.value?.path || rkey}`);
	}

	return documents;
}

// Write the publication rkey back into config.yml in place
function writeConfig(publicationRkey) {
	const source = readFileSync(configPath, 'utf-8');
	const updated = source.replace(
		/^(\s*rkey:\s*)(['"]?)[^'"\n]*\2/m,
		`$1'${publicationRkey}'`,
	);
	writeFileSync(configPath, updated);
}

// Write the sorted url → rkey map to documents.yml
function writeDocuments(documents) {
	const sorted = Object.fromEntries(
		Object.entries(documents).sort(([a], [b]) => a.localeCompare(b)),
	);
	const header = '# Generated by `npm run standard`. Don’t edit by hand.\n';
	const body = Object.keys(sorted).length
		? yamlDump(sorted, { quotingType: "'", forceQuotes: true, lineWidth: -1 })
		: '';
	writeFileSync(documentsPath, header + body);
}

const { token, did } = await login();
if (did !== config.did) {
	console.warn(
		`Logged-in DID (${did}) does not match config.yml did (${config.did}). ` +
			`Update config.yml or use a matching identifier.`,
	);
}

const publicationRkey = await syncPublication(token, did);
writeConfig(publicationRkey);

const documents = await syncDocuments(token, did, publicationRkey);
writeDocuments(documents);

console.log('\nstandard.site sync complete.');
