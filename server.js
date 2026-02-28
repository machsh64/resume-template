const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT_DIR = __dirname;
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(data));
}

function handleApi(req, res, pathname) {
  if (pathname !== '/api/resume') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const dataFile = path.join(ROOT_DIR, 'data.json');

  if (req.method === 'GET') {
    fs.readFile(dataFile, 'utf8', (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          sendJson(res, 200, {});
        } else {
          sendJson(res, 500, { error: 'Failed to read data.json' });
        }
        return;
      }
      try {
        const json = JSON.parse(content);
        sendJson(res, 200, json);
      } catch (e) {
        sendJson(res, 500, { error: 'Invalid JSON in data.json' });
      }
    });
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const json = JSON.parse(body || '{}');
        fs.writeFile(dataFile, JSON.stringify(json, null, 2), 'utf8', err => {
          if (err) {
            sendJson(res, 500, { error: 'Failed to write data.json' });
          } else {
            sendJson(res, 200, { success: true });
          }
        });
      } catch (e) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}

function handleStatic(req, res, pathname) {
  let filePath = pathname;
  if (filePath === '/') {
    filePath = '/index.html';
  }

  const absPath = path.join(ROOT_DIR, filePath.replace(/^\//, ''));

  fs.stat(absPath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(absPath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    const stream = fs.createReadStream(absPath);
    stream.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
    });
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname);
  } else {
    handleStatic(req, res, pathname);
  }
});

server.listen(PORT, () => {
  console.log(`Resume server running at http://localhost:${PORT}`);
});

