// Monta o pedido de questões e guarda um quiz da semana pronto (para abrir na hora).
import { ia } from './api.js';
import { atualizar, getEstado, montarContexto, pontosFracos, temasAnteriores, temasDaSemana } from './estado.js';
import { chaveSemana, hojeBR } from './shared/datas.js';
import { embaralhar, normalizarQuestao } from './util.js';

export function pedidoDaSemana(e, quantidade = 5, nivel = 'medio') {
  const revisao = [...new Set([...pontosFracos(e), ...embaralhar(temasAnteriores(e)).slice(0, 6)])];
  return {
    quantidade,
    nivel,
    temas: temasDaSemana(e),
    revisao,
    evitar: e.recentes.slice(-30),
    contexto: montarContexto(e),
  };
}

export async function gerarQuestoes(pedido) {
  const r = await ia('quiz', pedido);
  return r.questoes.map(normalizarQuestao);
}

let preparando = false;
export async function prepararQuizDaSemana() {
  const e = getEstado();
  const semana = chaveSemana(hojeBR());
  if (preparando || !temasDaSemana(e).length || e.cache.quizSemana?.semana === semana) return;
  preparando = true;
  try {
    const questoes = await gerarQuestoes(pedidoDaSemana(e));
    atualizar((x) => { x.cache.quizSemana = { semana, questoes }; }, { sincronizar: false });
  } catch {
    /* sem problema: gera na hora quando ela abrir */
  } finally {
    preparando = false;
  }
}

export function pegarQuizPronto() {
  const e = getEstado();
  const pronto = e.cache.quizSemana;
  if (!pronto || pronto.semana !== chaveSemana(hojeBR())) return null;
  atualizar((x) => { delete x.cache.quizSemana; }, { sincronizar: false });
  return pronto.questoes;
}
