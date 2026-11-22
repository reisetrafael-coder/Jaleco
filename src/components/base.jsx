import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { markdown, reduzirImagem } from '../util.js';

// ---------- Navegação (pelo #, para o botão voltar do Android funcionar) ----------
function lerRota() {
  const h = window.location.hash.replace(/^#/, '') || '/';
  const [caminho, busca = ''] = h.split('?');
  return { caminho, partes: caminho.split('/').filter(Boolean), params: new URLSearchParams(busca), chave: h };
}
let rotaAtual = lerRota();
const ouvintesRota = new Set();
function atualizarRota() {
  const nova = lerRota();
  if (nova.chave === rotaAtual.chave) return;
  rotaAtual = nova;
  ouvintesRota.forEach((f) => f());
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', atualizarRota);
window.addEventListener('popstate', atualizarRota);
export function useRota() {
  return useSyncExternalStore((f) => { ouvintesRota.add(f); return () => ouvintesRota.delete(f); }, () => rotaAtual);
}
// Guarda a "profundidade" no histórico para o voltar nunca sair do app sem querer.
export function navegar(caminho, { substituir = false } = {}) {
  const d = window.history.state?.d || 0;
  if (substituir) window.history.replaceState({ d }, '', '#' + caminho);
  else window.history.pushState({ d: d + 1 }, '', '#' + caminho);
  atualizarRota();
}
export function voltar(padrao = '/') {
  if ((window.history.state?.d || 0) > 0) window.history.back();
  else navegar(padrao, { substituir: true });
}

// ---------- Ícones ----------
const caminhos = {
  hoje: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
  quiz: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 8 3 3 5-6',
  tutora: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4.5 3.5V17H6a2 2 0 0 1-2-2zm4 4h.01M12 10h.01M16 10h.01',
  notas: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h7M9 17h5',
  agenda: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm-1 5h16M8 3v4M16 3v4',
  voltar: 'M15 5l-7 7 7 7',
  ajustes: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.1.9 1.6-1.9 3.2-1.8-.3a7 7 0 0 1-1.6.9L14.5 21h-5l-.5-2.2a7 7 0 0 1-1.6-.9l-1.8.3-1.9-3.2.9-1.6a7 7 0 0 1 0-1.8L3.7 10l1.9-3.2 1.8.3a7 7 0 0 1 1.6-.9L9.5 3h5l.5 2.2a7 7 0 0 1 1.6.9l1.8-.3 1.9 3.2-.9 1.6a7 7 0 0 1 0 1.8Z',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Zm-7 9a7 7 0 0 0 14 0M12 19v3',
  foto: 'M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  enviar: 'M4 12 20 4l-6 16-3-7z',
  mais: 'M12 5v14M5 12h14',
  lixo: 'M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  fogo: 'M12 21c-4 0-7-2.8-7-6.6 0-3.4 2.7-5.3 3.6-8.4.3 1.8 1.4 3 2.4 3.4C11.4 6.6 12.6 4.2 15 3c-.3 2.6.9 4.6 2.2 6.1 1.2 1.4 1.8 3 1.8 4.6C19 18 16 21 12 21Z',
  check: 'M5 12.5 10 17 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  parar: 'M7 7h10v10H7z',
};
export function Icone({ nome, tamanho = 22, ...resto }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...resto}>
      <path d={caminhos[nome]} />
    </svg>
  );
}

// ---------- Fita de esparadrapo (o "rótulo" do app) ----------
export function Fita({ children, cor, inclinacao = -1.5, className = '' }) {
  return (
    <span className={`fita ${cor ? `fita-${cor}` : ''} ${className}`} style={{ '--incl': `${inclinacao}deg` }}>
      {children}
    </span>
  );
}

export function Texto({ children, className = '' }) {
  return <div className={`texto ${className}`} dangerouslySetInnerHTML={{ __html: markdown(children || '') }} />;
}

export function Cabecalho({ titulo, voltarPara = '/', acao }) {
  return (
    <header className="cabecalho">
      <button className="btn-icone" onClick={() => voltar(voltarPara)} aria-label="Voltar">
        <Icone nome="voltar" />
      </button>
      <h1>{titulo}</h1>
      <div className="cabecalho-acao">{acao}</div>
    </header>
  );
}

// ---------- Microfone (fala vira texto) ----------
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
export function Microfone({ aoFalar, rotulo = 'Falar' }) {
  const [ouvindo, setOuvindo] = useState(false);
  const rec = useRef(null);
  useEffect(() => () => rec.current?.stop(), []);
  if (!Reconhecimento) return null;
  const alternar = () => {
    if (ouvindo) { rec.current?.stop(); return; }
    const r = new Reconhecimento();
    r.lang = 'pt-BR';
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) aoFalar(ev.results[i][0].transcript.trim());
      }
    };
    r.onend = () => setOuvindo(false);
    r.onerror = () => setOuvindo(false);
    rec.current = r;
    r.start();
    setOuvindo(true);
  };
  return (
    <button type="button" className={`btn-icone ${ouvindo ? 'gravando' : ''}`} onClick={alternar}
      aria-label={ouvindo ? 'Parar de ouvir' : rotulo} title={ouvindo ? 'Parar' : rotulo}>
      <Icone nome={ouvindo ? 'parar' : 'mic'} />
    </button>
  );
}

// ---------- Botão de foto ----------
export function BotaoFoto({ aoEscolher, aoErro, rotulo = 'Foto', comTexto = false }) {
  const ref = useRef(null);
  const escolher = async (ev) => {
    const arq = ev.target.files?.[0];
    ev.target.value = '';
    if (!arq) return;
    try {
      aoEscolher(await reduzirImagem(arq));
    } catch (e) {
      aoErro?.(e.message);
    }
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/*" hidden onChange={escolher} />
      <button type="button" className={comTexto ? 'btn btn-secundario' : 'btn-icone'} onClick={() => ref.current.click()} aria-label={rotulo}>
        <Icone nome="foto" />
        {comTexto && <span>{rotulo}</span>}
      </button>
    </>
  );
}

// ---------- Carregando ----------
const DICAS = [
  'Dica: explicar o assunto em voz alta, como se fosse pra alguém, ajuda a fixar.',
  'Dica: errar no quiz é bom. Cada erro vai pro caderno e volta na hora certa.',
  'Dica: 20 minutos todo dia rendem mais que 3 horas na véspera.',
  'Dica: depois do quiz, leia a explicação até das que você acertou.',
  'Dica: dormir bem antes da prova ajuda a memória mais que virar a noite.',
];
export function Carregando({ texto = 'Preparando…' }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * DICAS.length));
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % DICAS.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="carregando" role="status">
      <svg className="ecg" viewBox="0 0 120 40" aria-hidden="true">
        <path d="M0 22h34l6-12 8 26 7-20 5 6h60" />
      </svg>
      <p className="carregando-texto">{texto}</p>
      <p className="carregando-dica">{DICAS[i]}</p>
    </div>
  );
}

export function Aviso({ children, tipo = 'erro', aoFechar }) {
  if (!children) return null;
  return (
    <div className={`aviso aviso-${tipo}`} role="alert">
      <span>{children}</span>
      {aoFechar && (
        <button className="btn-icone pequeno" onClick={aoFechar} aria-label="Fechar aviso">
          <Icone nome="x" tamanho={18} />
        </button>
      )}
    </div>
  );
}
