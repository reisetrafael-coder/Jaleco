import { useState } from 'react';
import { ia } from '../api.js';
import { atualizar, montarContexto, semanaAtual, useEstado } from '../estado.js';
import { chaveSemana, formatarData, hojeBR } from '../shared/datas.js';
import { novoId } from '../util.js';
import { Aviso, BotaoFoto, Cabecalho, Carregando, Fita, Icone, Microfone, navegar, Texto } from '../components/base.jsx';
import { prepararQuizDaSemana } from '../quizDados.js';

const TIPOS = { prova: 'Prova', trabalho: 'Trabalho', estagio: 'Estágio', outro: 'Outro' };

export function Checkin() {
  const e = useEstado();
  const atual = semanaAtual(e);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState(null);
  const [fase, setFase] = useState(atual ? 'revisar' : 'contar');
  const [erro, setErro] = useState('');
  const [temas, setTemas] = useState(atual?.temas || []);
  const [enfase, setEnfase] = useState(atual?.enfase || []);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [resposta, setResposta] = useState('');
  const [novoTema, setNovoTema] = useState({ materia: '', tema: '' });

  const enviar = async () => {
    setErro('');
    setFase('carregando');
    try {
      const r = await ia('checkin', { texto, imagem: foto, contexto: montarContexto(e) });
      setTemas((antes) => [...antes, ...(r.temas || [])]);
      setEnfase((antes) => [...new Set([...antes, ...(r.enfase || [])])]);
      setAvaliacoes((r.avaliacoes || []).map((a) => ({ ...a, id: novoId(), incluir: !!a.data })));
      setResposta(r.resposta || '');
      setTexto('');
      setFoto(null);
      setFase('revisar');
    } catch (err) {
      setErro(err.message);
      setFase('contar');
    }
  };

  const adicionarTema = (ev) => {
    ev.preventDefault();
    if (!novoTema.tema.trim()) return;
    setTemas([...temas, { materia: novoTema.materia.trim() || 'Geral', tema: novoTema.tema.trim() }]);
    setNovoTema({ materia: novoTema.materia, tema: '' });
  };

  const salvar = () => {
    const semana = chaveSemana(hojeBR());
    atualizar((x) => {
      x.semanas[semana] = { temas, enfase, resumo: resposta, criadoEm: hojeBR() };
      for (const a of avaliacoes.filter((a) => a.incluir && a.data)) {
        x.avaliacoes.push({ id: a.id, titulo: a.titulo, tipo: a.tipo, data: a.data, temas: a.temas || [], feito: false });
      }
      delete x.cache.quizSemana;
    });
    prepararQuizDaSemana();
    navegar('/', { substituir: true });
  };

  if (fase === 'carregando') return <main className="tela"><Cabecalho titulo="Check-in da semana" /><Carregando texto="Lendo o que você mandou…" /></main>;

  return (
    <main className="tela">
      <Cabecalho titulo="Check-in da semana" />

      {fase === 'contar' && (
        <section className="pilha">
          <p className="intro">O que vocês vão ver no curso essa semana? Tem prova ou trabalho chegando? O que a professora disse que é importante?</p>
          <div className="caixa-escrever">
            <textarea value={texto} onChange={(ev) => setTexto(ev.target.value)} rows={6}
              placeholder="Ex.: essa semana é sinais vitais e começamos administração de medicamentos. Prova de farmaco na quinta que vem. A prof falou muito de gotejamento." />
            <div className="caixa-ferramentas">
              <Microfone aoFalar={(t) => setTexto((x) => (x ? `${x} ${t}` : t))} />
              <BotaoFoto aoEscolher={setFoto} aoErro={setErro} rotulo="Foto do slide ou cronograma" />
            </div>
          </div>
          {foto && (
            <div className="foto-previa">
              <img src={foto.url} alt="Foto enviada" />
              <button className="btn-icone pequeno" onClick={() => setFoto(null)} aria-label="Tirar foto"><Icone nome="x" tamanho={18} /></button>
            </div>
          )}
          <Aviso aoFechar={() => setErro('')}>{erro}</Aviso>
          <button className="btn btn-principal largo" disabled={!texto.trim() && !foto} onClick={enviar}>Enviar pra tutora</button>
          {atual && <button className="link centro" onClick={() => setFase('revisar')}>Voltar pros temas</button>}
        </section>
      )}

      {fase === 'revisar' && (
        <section className="pilha">
          {resposta && <div className="balao balao-tutora"><Texto>{resposta}</Texto></div>}

          <div className="cartao">
            <Fita>Temas da semana</Fita>
            {temas.length === 0 && <p className="vazio-texto">Nenhum tema ainda. Adicione abaixo ou volte e conte o que vai estudar.</p>}
            <ul className="lista-editavel">
              {temas.map((t, i) => (
                <li key={i}>
                  <span><span className="materia">{t.materia}</span>{t.tema}</span>
                  <button className="btn-icone pequeno" onClick={() => setTemas(temas.filter((_, j) => j !== i))} aria-label={`Remover ${t.tema}`}>
                    <Icone nome="x" tamanho={18} />
                  </button>
                </li>
              ))}
            </ul>
            <form className="form-linha" onSubmit={adicionarTema}>
              <input value={novoTema.materia} onChange={(ev) => setNovoTema({ ...novoTema, materia: ev.target.value })} placeholder="Matéria" aria-label="Matéria" />
              <input value={novoTema.tema} onChange={(ev) => setNovoTema({ ...novoTema, tema: ev.target.value })} placeholder="Tema" aria-label="Tema" />
              <button className="btn-icone" aria-label="Adicionar tema"><Icone nome="mais" /></button>
            </form>
          </div>

          {enfase.length > 0 && (
            <div className="cartao">
              <Fita cor="azul">A professora enfatizou</Fita>
              <ul className="lista-editavel">
                {enfase.map((t, i) => (
                  <li key={i}><span>{t}</span>
                    <button className="btn-icone pequeno" onClick={() => setEnfase(enfase.filter((_, j) => j !== i))} aria-label={`Remover ${t}`}><Icone nome="x" tamanho={18} /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {avaliacoes.length > 0 && (
            <div className="cartao">
              <Fita cor="vermelho">Avaliações que você citou</Fita>
              <ul className="lista-editavel">
                {avaliacoes.map((a, i) => (
                  <li key={a.id}>
                    <label className="checar">
                      <input type="checkbox" checked={a.incluir} onChange={(ev) => setAvaliacoes(avaliacoes.map((x, j) => (j === i ? { ...x, incluir: ev.target.checked } : x)))} />
                      <span><strong>{a.titulo}</strong> <small>{TIPOS[a.tipo] || ''}</small></span>
                    </label>
                    <input type="date" value={a.data || ''} aria-label="Data"
                      onChange={(ev) => setAvaliacoes(avaliacoes.map((x, j) => (j === i ? { ...x, data: ev.target.value, incluir: true } : x)))} />
                  </li>
                ))}
              </ul>
              <p className="nota-baixo">As marcadas vão pra sua agenda{avaliacoes.some((a) => !a.data) ? '. Coloque a data das que estão sem.' : '.'}</p>
            </div>
          )}

          <button className="btn btn-principal largo" disabled={!temas.length} onClick={salvar}>Salvar a semana</button>
          <button className="link centro" onClick={() => setFase('contar')}>Contar mais alguma coisa</button>
          {atual?.criadoEm && <p className="nota-baixo centro">Check-in feito em {formatarData(atual.criadoEm)}.</p>}
        </section>
      )}
    </main>
  );
}
