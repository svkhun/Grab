import { copyFile, mkdir, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'dist');
const staticFiles = ['index.html', 'styles.css', 'app.js', 'logic.mjs'];

// Keep the deploy artifact limited to the app. Guard the recursive cleanup path.
if (dirname(outputDirectory) !== projectRoot || basename(outputDirectory) !== 'dist') {
  throw new Error('Refusing to clean an unexpected output directory');
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory);
await Promise.all(staticFiles.map(file => copyFile(join(projectRoot, file), join(outputDirectory, file))));
console.log(`Built ${staticFiles.length} static files in dist/`);
