import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const root = process.argv.includes('--dist') ? join(projectRoot, 'dist') : projectRoot;
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/logic.mjs', ['logic.mjs', 'text/javascript; charset=utf-8']],
  ['/i18n.mjs', ['i18n.mjs', 'text/javascript; charset=utf-8']],
]);
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  const [path] = (request.url || '/').split('?');
  const entry = files.get(path);
  if (!entry) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const data = await readFile(join(root, entry[0]));
    response.writeHead(200, { 'content-type': entry[1], 'cache-control': 'no-store' });
    response.end(data);
  } catch { response.writeHead(500); response.end('Server error'); }
}).listen(port, '127.0.0.1', () => console.log(`Margin Missions: http://127.0.0.1:${port}`));
