import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';

const baseUrl = new URL('../', import.meta.url);

async function main() {
	const pkgMeta = JSON.parse(
		await readFile(
			fileURLToPath(new URL('package.json', baseUrl)
		), { encoding: 'utf-8'})
	);
	delete pkgMeta.devDependencies;
	delete pkgMeta.scripts;
	await writeFile(
		fileURLToPath(new URL('dist/package.json', baseUrl)),
		JSON.stringify(pkgMeta, null, 2)
	);
}

main();
