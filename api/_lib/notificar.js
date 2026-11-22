import webpush from 'web-push';
import { lerRegistro, salvarRegistro } from './banco.js';

export function pushConfigurado() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configurar() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:jaleco@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function lerInscricoes() {
  const r = await lerRegistro('push');
  return r?.data?.inscricoes || [];
}

export async function salvarInscricao(inscricao) {
  const lista = (await lerInscricoes()).filter((s) => s.endpoint !== inscricao.endpoint);
  lista.push(inscricao);
  await salvarRegistro('push', { inscricoes: lista.slice(-5) });
}

// Envia para todos os aparelhos inscritos e remove os que não existem mais.
export async function enviarParaTodos(mensagem) {
  configurar();
  const lista = await lerInscricoes();
  const validas = [];
  let enviadas = 0;
  for (const s of lista) {
    try {
      await webpush.sendNotification(s, JSON.stringify(mensagem), { TTL: 60 * 60 * 12 });
      validas.push(s);
      enviadas++;
    } catch (e) {
      if (e.statusCode !== 404 && e.statusCode !== 410) validas.push(s);
    }
  }
  if (validas.length !== lista.length) await salvarRegistro('push', { inscricoes: validas });
  return { enviadas, aparelhos: lista.length };
}
