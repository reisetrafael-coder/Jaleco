// Liga as notificações do celular (lembretes diários).
import { get, post } from './api.js';

function chaveParaBytes(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export const suportaNotificacoes = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export function permissaoAtual() {
  return suportaNotificacoes() ? Notification.permission : 'indisponivel';
}

export async function ativarNotificacoes() {
  if (!suportaNotificacoes()) throw new Error('Este navegador não aceita notificações. Instale o app pelo Chrome.');
  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') throw new Error('As notificações foram bloqueadas. Libere em Configurações > Apps > Chrome (ou Jaleco) > Notificações.');
  const r = await get('/api/push?acao=chave');
  if (r.desativado) throw new Error('As notificações ainda não foram configuradas no servidor (falta a chave VAPID na Vercel).');
  const reg = await navigator.serviceWorker.ready;
  let inscricao = await reg.pushManager.getSubscription();
  if (!inscricao) {
    inscricao = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(r.chave) });
  }
  await post('/api/push', { acao: 'inscrever', inscricao: inscricao.toJSON() });
  return true;
}

export async function testarNotificacao() {
  const r = await post('/api/push', { acao: 'teste' });
  if (r.desativado) throw new Error('As notificações não estão configuradas no servidor.');
  if (!r.enviadas) throw new Error('Nenhum aparelho inscrito. Toque em "Ativar notificações" primeiro.');
  return r;
}
