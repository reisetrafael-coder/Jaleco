// Guarda e devolve os dados do app (anotações, erros, progresso...) no banco.
import { conferirCodigo, lerJson, responder } from './_lib/http.js';
import { bancoConfigurado, lerRegistro, salvarRegistro } from './_lib/banco.js';

export default async function handler(req, res) {
  if (!conferirCodigo(req, res)) return;
  if (!bancoConfigurado()) return responder(res, 200, { desativado: true });
  try {
    if (req.method === 'GET') {
      const r = await lerRegistro('main');
      return responder(res, 200, r || { data: null, updatedAt: null });
    }
    if (req.method === 'PUT') {
      const { data } = await lerJson(req);
      if (!data || typeof data !== 'object') return responder(res, 400, { erro: 'Dados inválidos.' });
      const updatedAt = await salvarRegistro('main', data);
      return responder(res, 200, { ok: true, updatedAt });
    }
    responder(res, 405, { erro: 'Método não permitido.' });
  } catch (e) {
    responder(res, 502, { erro: e.message });
  }
}
