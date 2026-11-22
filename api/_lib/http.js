import { timingSafeEqual } from 'node:crypto';

export async function lerJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  const partes = [];
  for await (const p of req) partes.push(p);
  const texto = Buffer.concat(partes).toString('utf8');
  return texto ? JSON.parse(texto) : {};
}

export function responder(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

export function parametros(req) {
  return new URL(req.url, 'http://local').searchParams;
}

function iguais(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Confere o código de acesso do app (APP_PIN). Retorna false e responde se estiver errado.
export function conferirCodigo(req, res) {
  const codigo = process.env.APP_PIN;
  if (!codigo) {
    responder(res, 500, { erro: 'O código de acesso (APP_PIN) não foi configurado na Vercel.' });
    return false;
  }
  if (!iguais(req.headers['x-app-pin'], codigo)) {
    responder(res, 401, { erro: 'Código de acesso incorreto.' });
    return false;
  }
  return true;
}

export function conferirCron(req) {
  const segredo = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (segredo && iguais(auth, `Bearer ${segredo}`)) return true;
  const codigo = process.env.APP_PIN;
  return !!codigo && iguais(req.headers['x-app-pin'], codigo);
}
