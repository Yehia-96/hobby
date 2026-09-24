// Static file server for local development, plus one endpoint that lets
// tools/compile-targets.html save the compiled card targets straight into targets/.
//   node tools/dev-server.mjs            -> http://localhost:5173
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT ?? 5173);
const TARGETS_FILE = join(ROOT, 'targets', 'cards.mind');
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.glb': 'model/gltf-binary',
  '.mind': 'application/octet-stream',
};

const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

async function saveTargets(req, res) {
  if (!isLocal(req)) return send(res, 403, 'Only allowed from this machine');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_UPLOAD_BYTES) return send(res, 413, 'Too large');
    chunks.push(chunk);
  }
  await writeFile(TARGETS_FILE, Buffer.concat(chunks));
  console.log(`Saved ${size} bytes to ${TARGETS_FILE}`);
  send(res, 200, `Saved ${size} bytes`);
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const filePath = normalize(join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) return send(res, 403, 'Forbidden');

  try {
    if (!(await stat(filePath)).isFile()) return send(res, 404, 'Not found');
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[extname(filePath)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    send(res, 404, 'Not found');
  }
}

function send(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

createServer((req, res) => {
  const handler = req.method === 'POST' && req.url === '/api/targets' ? saveTargets : serveStatic;
  handler(req, res).catch((err) => {
    console.error(err);
    send(res, 500, 'Server error');
  });
}).listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}`));
