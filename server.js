const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = parseInt(process.env.PORT || '7979', 10);
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function resolveFilePath(reqUrl) {
  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(reqUrl.split('?')[0]);
  } catch {
    decodedPath = reqUrl.split('?')[0];
  }

  if (decodedPath === '/' || decodedPath === '') {
    return path.join(PUBLIC_DIR, 'index.html');
  }

  const safeRelPath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  let fullPath = path.join(PUBLIC_DIR, safeRelPath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  // Unicode NFC / NFD normalization fallback for Vietnamese filenames
  const dirName = path.dirname(fullPath);
  const baseName = path.basename(fullPath);
  if (fs.existsSync(dirName)) {
    try {
      const files = fs.readdirSync(dirName);
      const match = files.find(f =>
        f.normalize('NFC') === baseName.normalize('NFC') ||
        f.normalize('NFD') === baseName.normalize('NFD')
      );
      if (match) {
        return path.join(dirName, match);
      }
    } catch {
      // ignore
    }
  }

  // SPA fallback to index.html for non-asset routes
  if (!path.extname(decodedPath)) {
    return path.join(PUBLIC_DIR, 'index.html');
  }

  return null;
}

const server = http.createServer((req, res) => {
  const filePath = resolveFilePath(req.url);

  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isHtml = ext === '.html';

  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN'
  };

  // Cache static assets (images) for 6 months, index.html is no-cache for instant live updates
  if (isHtml) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  } else {
    headers['Cache-Control'] = 'public, max-age=15552000, immutable';
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = /\bgzip\b/.test(acceptEncoding) && (isHtml || ext === '.json' || ext === '.svg' || ext === '.js' || ext === '.css');

  if (canGzip) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    const rawStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 6 });
    rawStream.pipe(gzip).pipe(res);
  } else {
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sabaidee Brick Web Server is running at http://0.0.0.0:${PORT}`);
});
