// Todos os dados do app ficam aqui: salvos no celular e copiados para o servidor.
import { useSyncExternalStore } from 'react';
import { get, getCodigo, put } from './api.js';
import { chaveSemana, diasEntre, hojeBR, somarDias } from './shared/datas.js';
import { errosParaRevisar, proximasAvaliacoes } from './shared/lembretes.js';

const CHAVE = 'jaleco:estado';

const vazio = () => ({
  versao: 1,
  atualizadoEm: 0,
  perfil: { nome: '' },
  semanas: {},
  avaliacoes: [],
  erros: [],
  notas: [],
  conversas: [],
  historico: [],
  desempenho: {},
  diasEstudo: [],
  recentes: [],
  cache: {},
});

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    return salvo ? { ...vazio(), ...salvo } : vazio();
  } catch {
    return vazio();
  }
}

let estado = carregar();
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => f());

function salvarLocal() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch (e) {
    console.warn('Não foi possível salvar no aparelho', e);
  }
}

function aparar(e) {
  e.conversas = e.conversas.slice(-30).map((c) => ({ ...c, mensagens: c.mensagens.slice(-40) }));
  e.historico = e.historico.slice(-300);
  e.diasEstudo = [...new Set(e.diasEstudo)].sort().slice(-400);
  e.recentes = e.recentes.slice(-80);
}

export const getEstado = () => estado;

export function atualizar(fn, { sincronizar = true } = {}) {
  const novo = structuredClone(estado);
  fn(novo);
  aparar(novo);
  if (sincronizar) novo.atualizadoEm = Date.now();
  estado = novo;
  salvarLocal();
  avisar();
  if (sincronizar) agendarEnvio();
}

export function substituirTudo(dados) {
  estado = { ...vazio(), ...dados, cache: {} };
  estado.atualizadoEm = Date.now();
  salvarLocal();
  avisar();
  agendarEnvio();
}

export function useEstado() {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => estado);
}

// ---------- Sincronização com o servidor ----------
let statusSync = { situacao: 'parado', ultima: null };
const ouvintesSync = new Set();
function setStatus(s) {
  statusSync = { ...statusSync, ...s };
  ouvintesSync.forEach((f) => f());
}
export function useStatusSync() {
  return useSyncExternalStore((f) => { ouvintesSync.add(f); return () => ouvintesSync.delete(f); }, () => statusSync);
}

let timer;
let pendente = false;
function agendarEnvio() {
  pendente = true;
  clearTimeout(timer);
  timer = setTimeout(enviar, 2500);
}

export async function enviar() {
  clearTimeout(timer);
  if (!getCodigo() || !pendente) return;
  const { cache, ...dados } = estado;
  try {
    setStatus({ situacao: 'enviando' });
    const r = await put('/api/sync', { data: dados });
    pendente = false;
    setStatus(r.desativado ? { situacao: 'desativado' } : { situacao: 'ok', ultima: Date.now() });
  } catch {
    setStatus({ situacao: 'erro' });
  }
}

export async function baixar() {
  if (!getCodigo()) return;
  try {
    const r = await get('/api/sync');
    if (r.desativado) return setStatus({ situacao: 'desativado' });
    const remoto = r.data;
    if (remoto && (remoto.atualizadoEm || 0) > (estado.atualizadoEm || 0)) {
      estado = { ...vazio(), ...remoto, cache: estado.cache };
      salvarLocal();
      avisar();
    } else if (!remoto || (estado.atualizadoEm || 0) > (remoto.atualizadoEm || 0)) {
      pendente = true;
      await enviar();
    }
    setStatus({ situacao: 'ok', ultima: Date.now() });
  } catch (e) {
    setStatus({ situacao: e.status === 401 ? 'codigo' : 'erro' });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => pendente && enviar());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') enviar();
    else baixar();
  });
}

// ---------- Leituras úteis ----------
export const semanaAtual = (e) => e.semanas[chaveSemana(hojeBR())] || null;

export const textoTema = (t) => (t.materia ? `${t.materia}: ${t.tema}` : t.tema);

export function temasDaSemana(e) {
  return (semanaAtual(e)?.temas || []).map(textoTema);
}

export function temasAnteriores(e) {
  const atual = chaveSemana(hojeBR());
  return Object.entries(e.semanas)
    .filter(([k]) => k !== atual)
    .sort(([a], [b]) => b.localeCompare(a))
    .flatMap(([, s]) => s.temas.map(textoTema));
}

export function pontosFracos(e, max = 6) {
  return Object.entries(e.desempenho)
    .map(([tema, d]) => ({ tema, total: d.acertos + d.erros, taxa: d.acertos / Math.max(1, d.acertos + d.erros) }))
    .filter((d) => d.total >= 2 && d.taxa < 0.7)
    .sort((a, b) => a.taxa - b.taxa)
    .slice(0, max)
    .map((d) => d.tema);
}

export function montarContexto(e) {
  const hoje = hojeBR();
  return {
    nome: e.perfil.nome,
    hoje,
    temasSemana: temasDaSemana(e),
    enfase: semanaAtual(e)?.enfase || [],
    temasAnteriores: temasAnteriores(e).slice(0, 15),
    pontosFracos: pontosFracos(e),
    provas: proximasAvaliacoes(e, hoje).slice(0, 4).map((a) => `${a.titulo} em ${a.data}`),
  };
}

export const errosHoje = (e) => errosParaRevisar(e, hojeBR());

export function sequencia(e) {
  const dias = new Set(e.diasEstudo);
  let dia = hojeBR();
  if (!dias.has(dia)) dia = somarDias(dia, -1);
  let n = 0;
  while (dias.has(dia)) {
    n++;
    dia = somarDias(dia, -1);
  }
  return n;
}

export function marcarEstudo(e) {
  e.diasEstudo.push(hojeBR());
}

// Repetição espaçada do caderno de erros: 1, 3 e 7 dias.
const INTERVALOS = [1, 3, 7];
export function registrarRevisao(erro, acertou) {
  const hoje = hojeBR();
  if (acertou) {
    erro.acertosSeguidos = (erro.acertosSeguidos || 0) + 1;
    if (erro.acertosSeguidos > INTERVALOS.length) {
      erro.dominada = true;
      erro.dominadaEm = hoje;
    } else {
      erro.proxima = somarDias(hoje, INTERVALOS[erro.acertosSeguidos - 1]);
    }
  } else {
    erro.acertosSeguidos = 0;
    erro.vezesErrou = (erro.vezesErrou || 1) + 1;
    erro.proxima = somarDias(hoje, 1);
  }
}

export function registrarResultado(e, tema, acertou) {
  const d = e.desempenho[tema] || { acertos: 0, erros: 0 };
  if (acertou) d.acertos++;
  else d.erros++;
  e.desempenho[tema] = d;
}

export { diasEntre, hojeBR };
