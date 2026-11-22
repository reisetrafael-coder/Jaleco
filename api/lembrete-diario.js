// Chamado automaticamente pela Vercel uma vez por dia (veja vercel.json).
import { conferirCron, responder } from './_lib/http.js';
import { bancoConfigurado, lerRegistro } from './_lib/banco.js';
import { enviarParaTodos, pushConfigurado } from './_lib/notificar.js';
import { montarLembrete } from '../src/shared/lembretes.js';
import { RECADOS } from '../src/config.js';

export default async function handler(req, res) {
  if (!conferirCron(req)) return responder(res, 401, { erro: 'Não autorizado.' });
  if (!pushConfigurado() || !bancoConfigurado()) return responder(res, 200, { desativado: true });
  try {
    const registro = await lerRegistro('main');
    const mensagem = montarLembrete(registro?.data, RECADOS);
    if (!mensagem) return responder(res, 200, { enviado: false, motivo: 'Nada pendente hoje.' });
    const r = await enviarParaTodos(mensagem);
    responder(res, 200, { enviado: true, ...r, mensagem });
  } catch (e) {
    responder(res, 502, { erro: e.message });
  }
}
