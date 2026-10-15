import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src');
const output = path.join(root, 'dist');
const rawPlatform = process.env.TAURI_ENV_PLATFORM;
const platform = ({ darwin: 'macos', macos: 'macos', windows: 'windows', linux: 'linux' })[rawPlatform];

if (!platform) {
	throw new Error(`Unsupported or missing TAURI_ENV_PLATFORM: ${rawPlatform ?? '(unset)'}`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

for (const entry of await readdir(output, { withFileTypes: true })) {
	if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

	const htmlPath = path.join(output, entry.name);
	const html = await readFile(htmlPath, 'utf8');
	const additions = [
		'    <meta name="color-scheme" content="light dark" />',
		'    <link rel="stylesheet" href="native.css" />',
		`    <link rel="stylesheet" href="platform-${platform}.css" />`,
	].join('\n');
	await writeFile(htmlPath, html.replace('</head>', `${additions}\n  </head>`), 'utf8');
}

console.log(`Prepared ${platform} frontend in ${path.relative(root, output)}`);
