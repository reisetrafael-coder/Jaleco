// Modo demonstração: só existe na versão de vitrine (build com VITE_DEMO=1).
// Responde as chamadas do servidor aqui mesmo, com a IA simulada.
import { respostaFalsa, textoFalso } from '../api/_lib/simulacao.js';

const json = (obj) => new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } });
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const FERRAMENTA = { quiz: 'entregar_questoes', checkin: 'registrar_semana', foto_nota: 'criar_anotacao', plano: 'entregar_plano' };

const fetchOriginal = window.fetch.bind(window);
window.fetch = async (url, opcoes = {}) => {
  const caminho = typeof url === 'string' ? url : url.url;
  if (!caminho.startsWith('/api/')) return fetchOriginal(url, opcoes);
  if (caminho.startsWith('/api/sync')) return json({ desativado: true });
  if (caminho.startsWith('/api/push')) return json({ desativado: true });
  const corpo = JSON.parse(opcoes.body || '{}');
  await esperar(900);
  if (corpo.acao === 'resumo') return json({ texto: textoFalso() });
  if (corpo.acao === 'chat') {
    const texto = textoFalso();
    const enc = new TextEncoder();
    const fluxo = new ReadableStream({
      async start(c) {
        for (const pedaco of texto.match(/.{1,10}/gs)) { c.enqueue(enc.encode(pedaco)); await esperar(25); }
        c.close();
      },
    });
    return new Response(fluxo, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return json(respostaFalsa(FERRAMENTA[corpo.acao]));
};
