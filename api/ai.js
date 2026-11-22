// Ponto de entrada da IA tutora: quiz, check-in, chat, resumo, foto e plano de revisão.
import { conferirCodigo, lerJson, responder } from './_lib/http.js';
import { pedirEstruturado, pedirTexto, transmitirTexto } from './_lib/claude.js';
import * as I from './_lib/instrucoes.js';


const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function conteudoUsuario(texto, imagem) {
  if (!imagem?.data) return texto;
  const tipo = TIPOS_IMAGEM.includes(imagem.tipo) ? imagem.tipo : 'image/jpeg';
  return [
    { type: 'image', source: { type: 'base64', media_type: tipo, data: imagem.data } },
    { type: 'text', text: texto || 'Veja a imagem.' },
  ];
}

function limpar(s, max = 4000) {
  return String(s || '').slice(0, max);
}

const acoes = {
  async quiz(p) {
    const n = Math.min(Math.max(Number(p.quantidade) || 5, 1), 10);
    const nivel = { facil: 'fácil (conceitos básicos)', medio: 'médio (nível de prova do curso)', prova: 'difícil (nível de concurso para técnico)' }[p.nivel] || 'médio';
    const linhas = [`Crie ${n} questões de nível ${nivel}.`];
    if (p.textoBase) {
      linhas.push(`Baseie as questões SOMENTE neste material de estudo da estudante:\n"""${limpar(p.textoBase, 8000)}"""`);
    } else {
      if (p.temas?.length) linhas.push(`Temas principais (cerca de 70% das questões): ${p.temas.join('; ')}.`);
      if (p.revisao?.length) linhas.push(`Temas para revisão (cerca de 30% das questões): ${p.revisao.join('; ')}.`);
      if (!p.temas?.length && !p.revisao?.length) linhas.push('Temas variados do curso técnico em enfermagem.');
    }
    if (p.evitar?.length) linhas.push(`Evitar (já foram feitas): ${p.evitar.slice(0, 30).map((e) => limpar(e, 140)).join(' | ')}`);
    const r = await pedirEstruturado({
      sistema: I.BASE + I.contexto(p.contexto) + I.QUIZ,
      mensagens: [{ role: 'user', content: linhas.join('\n\n') }],
      ferramenta: I.FERRAMENTA_QUIZ,
      maxTokens: 900 * n + 500,
    });
    const questoes = (r.questoes || []).filter(
      (q) => q.alternativas?.length >= 2 && q.alternativas.filter((a) => a.correta).length === 1,
    );
    if (!questoes.length) throw new Error('Não consegui montar as questões dessa vez. Tenta de novo.');
    return { questoes };
  },

  async checkin(p) {
    const r = await pedirEstruturado({
      sistema: I.BASE + I.contexto(p.contexto) + I.CHECKIN,
      mensagens: [{ role: 'user', content: conteudoUsuario(limpar(p.texto, 6000) || 'Segue a foto do que vou estudar.', p.imagem) }],
      ferramenta: I.FERRAMENTA_CHECKIN,
      maxTokens: 2000,
    });
    return r;
  },

  async foto_nota(p) {
    return pedirEstruturado({
      sistema: I.BASE + I.FOTO_NOTA,
      mensagens: [{ role: 'user', content: conteudoUsuario(limpar(p.texto, 500) || 'Transforme em anotação.', p.imagem) }],
      ferramenta: I.FERRAMENTA_FOTO,
      maxTokens: 3000,
    });
  },

  async resumo(p) {
    const texto = await pedirTexto({
      sistema: I.BASE + I.RESUMO,
      mensagens: [{ role: 'user', content: `Anotação "${limpar(p.titulo, 200)}":\n\n${limpar(p.texto, 12000)}` }],
      maxTokens: 1500,
    });
    return { texto };
  },

  async plano(p) {
    return pedirEstruturado({
      sistema: I.BASE + I.contexto(p.contexto) + I.PLANO,
      mensagens: [{
        role: 'user',
        content: `Avaliação: ${limpar(p.titulo, 200)} em ${p.data}. Hoje é ${p.hoje}.\nTemas da avaliação: ${(p.temas || []).join('; ') || 'não informados (use os temas recentes do contexto)'}.`,
      }],
      ferramenta: I.FERRAMENTA_PLANO,
      maxTokens: 2500,
    });
  },
};

async function chat(p, res) {
  const historico = (p.mensagens || []).slice(-16).map((m, i, arr) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: i === arr.length - 1 && m.role === 'user' ? conteudoUsuario(limpar(m.texto, 6000), p.imagem) : limpar(m.texto, 6000) || '(foto)',
  }));
  while (historico.length && historico[0].role !== 'user') historico.shift();
  if (!historico.length) return responder(res, 400, { erro: 'Mensagem vazia.' });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');
  try {
    await transmitirTexto({
      sistema: I.BASE + I.contexto(p.contexto),
      mensagens: historico,
      maxTokens: 2000,
      aoReceber: (t) => res.write(t),
    });
  } catch (e) {
    res.write(`\n\n⚠️ ${e.message}`);
  }
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
  if (!conferirCodigo(req, res)) return;
  let p;
  try { p = await lerJson(req); } catch { return responder(res, 400, { erro: 'Pedido inválido.' }); }
  if (p.acao === 'chat') return chat(p, res);
  const acao = acoes[p.acao];
  if (!acao) return responder(res, 400, { erro: 'Ação desconhecida.' });
  try {
    responder(res, 200, await acao(p));
  } catch (e) {
    responder(res, 502, { erro: e.message || 'Erro na IA.' });
  }
}
