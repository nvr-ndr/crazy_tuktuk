import http from 'node:http';

const port = Number(process.env.PORT || 8080);
const requiredForRunner = ['DATABASE_URL', 'DFLOW_PASSPHRASE', 'DFLOW_RPC_URL'];

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method !== 'GET') return json(response, 405, { error: 'method_not_allowed' });
  if (url.pathname === '/health') return json(response, 200, { service: 'crazy-tuk-agent-runner', status: 'ok' });
  if (url.pathname === '/ready') {
    const missing = requiredForRunner.filter((key) => !process.env[key]);
    return json(response, missing.length ? 503 : 200, {
      service: 'crazy-tuk-agent-runner',
      status: missing.length ? 'configuration_required' : 'ready',
      missing
    });
  }
  return json(response, 404, { error: 'not_found' });
});

server.listen(port, '0.0.0.0', () => console.log(`Crazy Tuk Agent Runner listening on ${port}`));
