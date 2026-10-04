import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8080);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
// Allow only application files; never expose .git or local configuration.
function allowed(relative) {
  return ['index.html', 'styles.css'].includes(relative) || /^(src|assets)\/[\w/-]+\.(js|svg)$/.test(relative);
}
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    const url = new URL(req.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
    if (!allowed(relative)) { res.writeHead(404); return res.end('Not found'); }
    const file = path.resolve(root, relative);
    if (!file.startsWith(root) || !(await stat(file)).isFile()) { res.writeHead(404); return res.end('Not found'); }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Length': data.length });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`Frontier Lab: http://127.0.0.1:${port}\nStrg+C beendet den Server.\n`));
server.on('error', error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
