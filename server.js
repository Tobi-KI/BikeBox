const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8000;
const root = __dirname;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendFile(res, filePath, statusCode = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = contentTypes[ext] || 'application/octet-stream';
    res.writeHead(statusCode, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requested = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(requested).replace(/^\.\.(\/|\\|$)/, '');

  let filePath = path.join(root, safePath);
  if (safePath === '/' || safePath === '.') {
    filePath = path.join(root, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      return sendFile(res, path.join(filePath, 'index.html'));
    }

    if (!err && stats.isFile()) {
      return sendFile(res, filePath);
    }

    return sendFile(res, path.join(root, 'index.html'));
  });
});

server.listen(port, () => {
  console.log(`BikeBox app running on http://0.0.0.0:${port}`);
});
