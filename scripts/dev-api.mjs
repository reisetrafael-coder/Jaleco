// Servidor local só para testes: roda as funções da pasta /api sem a Vercel.
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
http.createServer(async (req, res) => {
  const nome = new URL(req.url, 'http://x').pathname.replace(/^\/api\//, '').replace(/[^a-z-]/g, '');
  try {
    const mod = await import(pathToFileURL(path.join(raiz, 'api', `${nome}.js`)).href);
    await mod.default(req, res);
  } catch (e) {
    res.statusCode = 404;
    res.end(String(e.message));
  }
}).listen(3001, () => console.log('API local em http://localhost:3001'));
