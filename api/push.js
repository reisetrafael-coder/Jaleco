// Notificações: chave pública, inscrição do celular e notificação de teste.
import { conferirCodigo, lerJson, parametros, responder } from './_lib/http.js';
import { bancoConfigurado } from './_lib/banco.js';
import { enviarParaTodos, pushConfigurado, salvarInscricao } from './_lib/notificar.js';

export default async function handler(req, res) {
  if (!conferirCodigo(req, res)) return;
  if (!pushConfigurado() || !bancoConfigurado()) {
    return responder(res, 200, { desativado: true });
  }
  try {
    if (req.method === 'GET' && parametros(req).get('acao') === 'chave') {
      return responder(res, 200, { chave: process.env.VAPID_PUBLIC_KEY });
    }
    if (req.method === 'POST') {
      const p = await lerJson(req);
      if (p.acao === 'inscrever' && p.inscricao?.endpoint) {
        await salvarInscricao(p.inscricao);
        return responder(res, 200, { ok: true });
      }
      if (p.acao === 'teste') {
        const r = await enviarParaTodos({
          title: 'Notificações ligadas ✅',
          body: 'É assim que os lembretes de estudo vão aparecer.',
          url: '/',
        });
        return responder(res, 200, r);
      }
    }
    responder(res, 400, { erro: 'Pedido inválido.' });
  } catch (e) {
    responder(res, 502, { erro: e.message });
  }
}
