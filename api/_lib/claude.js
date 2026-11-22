// Conversa com a API do Claude (Anthropic).
import { respostaFalsa, textoFalso } from './simulacao.js';

const ENDERECO = 'https://api.anthropic.com/v1/messages';
export const modelo = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const simulado = () => !!process.env.MOCK_AI;

function erroAmigavel(status, texto) {
  if (status === 401) return 'A chave da API do Claude está errada ou foi apagada. Confira ANTHROPIC_API_KEY na Vercel.';
  if (/credit balance|billing/i.test(texto)) return 'Acabaram os créditos da API do Claude. Adicione créditos no painel da Anthropic.';
  if (status === 429) return 'Muitas perguntas em pouco tempo. Espera um minutinho e tenta de novo.';
  if (status === 529 || status === 503) return 'O Claude está sobrecarregado agora. Tenta de novo em alguns segundos.';
  if (status === 404 && /model/i.test(texto)) return `O modelo "${modelo()}" não foi encontrado. Confira ANTHROPIC_MODEL na Vercel.`;
  return `A IA respondeu com erro ${status}.`;
}

function cabecalhos() {
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) throw new Error('A chave da API do Claude (ANTHROPIC_API_KEY) não foi configurada na Vercel.');
  return {
    'x-api-key': chave,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };
}

// Pede uma resposta estruturada (JSON) usando uma "ferramenta" obrigatória.
export async function pedirEstruturado({ sistema, mensagens, ferramenta, maxTokens = 4000 }) {
  if (simulado()) return respostaFalsa(ferramenta.name, mensagens);
  const r = await fetch(ENDERECO, {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify({
      model: modelo(),
      max_tokens: maxTokens,
      system: sistema,
      messages: mensagens,
      tools: [ferramenta],
      tool_choice: { type: 'tool', name: ferramenta.name },
    }),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(erroAmigavel(r.status, texto));
  const dados = JSON.parse(texto);
  const bloco = (dados.content || []).find((b) => b.type === 'tool_use');
  if (!bloco) throw new Error('A IA não devolveu a resposta no formato esperado. Tenta de novo.');
  return bloco.input;
}

// Pede texto livre (sem streaming).
export async function pedirTexto({ sistema, mensagens, maxTokens = 2000 }) {
  if (simulado()) return textoFalso(mensagens);
  const r = await fetch(ENDERECO, {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify({ model: modelo(), max_tokens: maxTokens, system: sistema, messages: mensagens }),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(erroAmigavel(r.status, texto));
  const dados = JSON.parse(texto);
  return (dados.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

// Resposta em tempo real (aparece aos poucos), usada no chat.
export async function transmitirTexto({ sistema, mensagens, maxTokens = 2000, aoReceber }) {
  if (simulado()) {
    const t = textoFalso(mensagens);
    for (const pedaco of t.match(/.{1,12}/gs)) {
      aoReceber(pedaco);
      await new Promise((ok) => setTimeout(ok, 15));
    }
    return;
  }
  const r = await fetch(ENDERECO, {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify({ model: modelo(), max_tokens: maxTokens, system: sistema, messages: mensagens, stream: true }),
  });
  if (!r.ok) throw new Error(erroAmigavel(r.status, await r.text()));
  const leitor = r.body.getReader();
  const dec = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    let fim;
    while ((fim = buffer.indexOf('\n\n')) >= 0) {
      const evento = buffer.slice(0, fim);
      buffer = buffer.slice(fim + 2);
      for (const linha of evento.split('\n')) {
        if (!linha.startsWith('data:')) continue;
        let json;
        try { json = JSON.parse(linha.slice(5).trim()); } catch { continue; }
        if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') aoReceber(json.delta.text);
        if (json.type === 'error') throw new Error(erroAmigavel(529, JSON.stringify(json.error || {})));
      }
    }
  }
}
