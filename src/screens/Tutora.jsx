import { useEffect, useRef, useState } from 'react';
import { iaChat } from '../api.js';
import { atualizar, marcarEstudo, montarContexto, getEstado, semanaAtual, useEstado } from '../estado.js';
import { hojeBR, formatarData } from '../shared/datas.js';
import { novoId } from '../util.js';
import { Aviso, BotaoFoto, Cabecalho, Icone, Microfone, navegar, Texto, useRota } from '../components/base.jsx';

// Texto deixado por outra tela (ex.: "Perguntar à tutora" no quiz) para enviar ao abrir o chat.
let rascunho = null;
export const definirRascunho = (t) => { rascunho = t; };

const RAPIDAS = [
  ['Explica mais simples', 'Explica de um jeito mais simples, como se eu estivesse vendo isso pela primeira vez.'],
  ['Aprofunda', 'Aprofunda mais esse assunto, no nível de prova.'],
  ['Exemplo de plantão', 'Me dá um exemplo prático de como isso aparece no estágio ou no plantão.'],
  ['Me testa', 'Me faz uma pergunta sobre isso pra ver se eu entendi. Espera a minha resposta antes de explicar.'],
];

const FEYNMAN = 'Quero treinar explicando com as minhas palavras. Escolha um tema da semana, peça pra eu explicar e espere a minha resposta. Depois corrija: diga o que ficou certo, o que faltou e me dê uma nota de 0 a 10.';

export function Tutora() {
  const { partes } = useRota();
  if (partes[1]) return <Chat key={partes[1]} id={partes[1] === 'nova' ? null : partes[1]} />;
  return <Conversas />;
}

function Conversas() {
  const e = useEstado();
  const lista = [...e.conversas].reverse();
  return (
    <main className="tela">
      <header className="tela-topo">
        <h1>Tutora</h1>
        <button className="btn btn-principal" onClick={() => navegar('/tutora/nova')}><Icone nome="mais" tamanho={18} /> Nova conversa</button>
      </header>
      <p className="intro">Pergunte qualquer coisa do curso. A tutora sabe o que você está estudando essa semana e onde você mais tem errado.</p>
      <button className="cartao cartao-acao suave" onClick={() => { definirRascunho(FEYNMAN); navegar('/tutora/nova'); }}>
        <Icone nome="tutora" />
        <span><strong>Modo professora</strong><small>Você explica um assunto e a tutora corrige e dá nota. Um dos jeitos que mais fixa o conteúdo.</small></span>
      </button>
      {lista.length === 0 ? (
        <div className="vazio"><p>Suas conversas vão aparecer aqui.</p></div>
      ) : (
        <ul className="lista-simples clicavel">
          {lista.map((c) => (
            <li key={c.id}>
              <button onClick={() => navegar(`/tutora/${c.id}`)}>
                <p>{c.titulo}</p>
                <small>{formatarData(c.criadoEm)}, {c.mensagens.length} mensagens</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Chat({ id: idInicial }) {
  const e = useEstado();
  const { params } = useRota();
  const [id, setId] = useState(idInicial);
  const conversa = e.conversas.find((c) => c.id === id);
  const mensagens = conversa?.mensagens || [];
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState(null);
  const [parcial, setParcial] = useState(null);
  const [pendente, setPendente] = useState(null);
  const [erro, setErro] = useState('');
  const fim = useRef(null);
  const ocupado = parcial !== null;

  useEffect(() => { fim.current?.scrollIntoView({ block: 'end' }); }, [mensagens.length, parcial, pendente]);

  const enviar = async (conteudo, imagem = foto) => {
    const t = (conteudo ?? texto).trim();
    if ((!t && !imagem) || ocupado) return;
    setErro('');
    const msg = { role: 'user', texto: t || 'Me explica essa foto.', foto: !!imagem };
    let cid = id;
    if (!cid) {
      cid = novoId();
      atualizar((x) => { x.conversas.push({ id: cid, titulo: msg.texto.slice(0, 70), criadoEm: hojeBR(), mensagens: [] }); });
      setId(cid);
      window.history.replaceState(window.history.state, '', `#/tutora/${cid}`);
    }
    const anteriores = getEstado().conversas.find((c) => c.id === cid)?.mensagens || [];
    setPendente(msg);
    setTexto('');
    setFoto(null);
    setParcial('');
    try {
      const resposta = await iaChat(
        { mensagens: [...anteriores, msg].map((m) => ({ role: m.role, texto: m.texto })), imagem, contexto: montarContexto(getEstado()) },
        setParcial,
      );
      atualizar((x) => {
        const c = x.conversas.find((y) => y.id === cid);
        c.mensagens.push(msg, { role: 'assistant', texto: resposta });
        marcarEstudo(x);
      });
    } catch (err) {
      setErro(err.message);
      setTexto(msg.texto);
    } finally {
      setPendente(null);
      setParcial(null);
    }
  };

  useEffect(() => {
    if (rascunho && !idInicial) {
      const r = rascunho;
      rascunho = null;
      enviar(r, null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const semana = semanaAtual(e);
  const sugestoes = [
    semana && ['Me explica o conteúdo da semana do começo', `Me explica do começo o conteúdo dessa semana: ${semana.temas.map((t) => t.tema).join(', ')}. Vai por partes.`],
    params.get('sugestao') === 'duvida-aula' && ['Tenho uma dúvida da aula', 'Tenho uma dúvida sobre a aula dessa semana: '],
    ['Como calcular gotejamento?', 'Como calcular gotejamento de soro em macrogotas e microgotas? Me mostra com um exemplo.'],
    ['Sinais de alerta', 'Quais sinais de alerta nos sinais vitais eu preciso comunicar ao enfermeiro?'],
    ['Me ajuda a revisar pra prova', 'Me ajuda a revisar pra minha próxima prova. Por onde eu começo?'],
  ].filter(Boolean);

  const ultima = mensagens[mensagens.length - 1];

  return (
    <main className="tela chat">
      <Cabecalho titulo="Tutora" voltarPara="/tutora" />
      <div className="mensagens">
        {mensagens.length === 0 && !pendente && (
          <div className="chat-vazio">
            <p>Sobre o que você quer falar?</p>
            <div className="sugestoes">
              {sugestoes.map(([rotulo, t]) => (
                <button key={rotulo} onClick={() => (t.endsWith(': ') ? setTexto(t) : enviar(t))}>{rotulo}</button>
              ))}
            </div>
          </div>
        )}
        {mensagens.map((m, i) => (
          <div key={i} className={`balao ${m.role === 'user' ? 'balao-eu' : 'balao-tutora'}`}>
            {m.role === 'user' ? <p>{m.foto && <span className="marca-foto">📷 foto</span>}{m.texto}</p> : <Texto>{m.texto}</Texto>}
          </div>
        ))}
        {pendente && (
          <div className="balao balao-eu"><p>{pendente.foto && <span className="marca-foto">📷 foto</span>}{pendente.texto}</p></div>
        )}
        {parcial !== null && (
          <div className="balao balao-tutora">{parcial ? <Texto>{parcial}</Texto> : <p className="digitando"><span /><span /><span /></p>}</div>
        )}
        {!ocupado && ultima?.role === 'assistant' && (
          <div className="rapidas">
            {RAPIDAS.map(([r, t]) => <button key={r} onClick={() => enviar(t, null)}>{r}</button>)}
          </div>
        )}
        <Aviso aoFechar={() => setErro('')}>{erro}</Aviso>
        <p className="aviso-ia">A tutora pode errar. Em doses e protocolos, vale sempre a prescrição e o protocolo da instituição.</p>
        <div ref={fim} />
      </div>

      <form className="barra-enviar" onSubmit={(ev) => { ev.preventDefault(); enviar(); }}>
        {foto && (
          <div className="foto-previa mini">
            <img src={foto.url} alt="Foto anexada" />
            <button type="button" className="btn-icone pequeno" onClick={() => setFoto(null)} aria-label="Tirar foto"><Icone nome="x" tamanho={16} /></button>
          </div>
        )}
        <BotaoFoto aoEscolher={setFoto} aoErro={setErro} rotulo="Anexar foto" />
        <textarea value={texto} onChange={(ev) => setTexto(ev.target.value)} rows={1} placeholder="Escreva sua dúvida…"
          onKeyDown={(ev) => { if (ev.key === 'Enter' && !ev.shiftKey && window.matchMedia('(pointer: fine)').matches) { ev.preventDefault(); enviar(); } }} />
        <Microfone aoFalar={(t) => setTexto((x) => (x ? `${x} ${t}` : t))} />
        <button className="btn-icone enviar" disabled={ocupado || (!texto.trim() && !foto)} aria-label="Enviar">
          <Icone nome="enviar" />
        </button>
      </form>
    </main>
  );
}
