const http = require('http');
const fs = require('fs');
const path = require('path');
const orderHandler = require('./api/dflow/order.js');
const eligibilityHandler = require('./api/_handlers/dflowEligibility.js');
const routeHandler = require('./api/route.js');

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `localhost:${port}`}`);

  if (url.pathname === '/api/dflow/order') {
    request.query = Object.fromEntries(url.searchParams);
    return orderHandler(request, response);
  }
  if (url.pathname === '/api/dflow/eligibility') {
    request.query = Object.fromEntries(url.searchParams.entries());
    return eligibilityHandler(request, response);
  }

  if (url.pathname === '/api/route') {
    request.query = Object.fromEntries(url.searchParams);
    return routeHandler(request, response);
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.resolve(root, `.${decodeURIComponent(requestedPath)}`);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(response);
  });
});

server.listen(port, () => {
  console.log(`Crazy Tuk dev server listening at http://localhost:${port}`);
});
