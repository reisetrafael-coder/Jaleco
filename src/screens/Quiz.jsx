import { useEffect, useRef, useState } from 'react';
import { atualizar, getEstado, marcarEstudo, montarContexto, pontosFracos, registrarResultado, temasDaSemana, useEstado } from '../estado.js';
import { hojeBR } from '../shared/datas.js';
import { RECADOS_PARABENS, ASSINATURA } from '../config.js';
import { Aviso, Cabecalho, Carregando, Fita, Icone, navegar, useRota } from '../components/base.jsx';
import { Questao, perguntaSobreQuestao } from '../components/Questao.jsx';
import { gerarQuestoes, pedidoDaSemana, pegarQuizPronto, prepararQuizDaSemana } from '../quizDados.js';
import { novoId } from '../util.js';
import { definirRascunho } from './Tutora.jsx';

const NIVEIS = [['facil', 'Fácil'], ['medio', 'Médio'], ['prova', 'Nível prova']];

// Quiz em andamento: sobrevive à ida até a tutora e à volta.
let sessao = null;

export function Quiz() {
  const e = useEstado();
  const { params } = useRota();
  const notaId = params.get('nota');
  const nota = notaId ? e.notas.find((n) => n.id === notaId) : null;
  const temSemana = temasDaSemana(e).length > 0;

  const [modo, setModo] = useState(nota ? 'nota' : params.get('modo') || (temSemana ? 'semana' : 'tema'));
  const [tema, setTema] = useState(params.get('tema') || '');
  const [quantidade, setQuantidade] = useState(5);
  const [nivel, setNivel] = useState('medio');
  const [fase, setFase] = useState(sessao?.fase || 'config');
  const [erro, setErro] = useState('');
  const [questoes, setQuestoes] = useState(sessao?.questoes || []);
  const [atual, setAtual] = useState(sessao?.atual || 0);
  const [respostas, setRespostas] = useState(sessao?.respostas || []);
  const iniciou = useRef(!!sessao);

  useEffect(() => {
    sessao = fase === 'respondendo' || fase === 'fim' ? { fase, questoes, atual, respostas, modo } : null;
  }, [fase, questoes, atual, respostas, modo]);

  const comecar = async () => {
    setErro('');
    setFase('carregando');
    try {
      let lista = null;
      if (modo === 'semana' && quantidade === 5 && nivel === 'medio') lista = pegarQuizPronto();
      if (!lista) {
        const est = getEstado();
        let pedido;
        if (modo === 'semana') pedido = pedidoDaSemana(est, quantidade, nivel);
        else if (modo === 'nota') pedido = { quantidade, nivel, textoBase: `${nota.titulo}\n\n${nota.texto}`, contexto: montarContexto(est) };
        else if (modo === 'fracos') pedido = { quantidade, nivel, temas: pontosFracos(est), evitar: est.recentes.slice(-30), contexto: montarContexto(est) };
        else pedido = { quantidade, nivel, temas: [tema.trim()], evitar: est.recentes.slice(-30), contexto: montarContexto(est) };
        lista = await gerarQuestoes(pedido);
      }
      setQuestoes(lista);
      setAtual(0);
      setRespostas([]);
      setFase('respondendo');
    } catch (err) {
      setErro(err.message);
      setFase('config');
    }
  };

  useEffect(() => {
    if (params.get('auto') && !iniciou.current && (modo !== 'semana' || temSemana)) {
      iniciou.current = true;
      comecar();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const responder = (q, acertou, indice) => {
    setRespostas((r) => [...r, { acertou, tema: q.tema, indice }]);
    atualizar((x) => {
      registrarResultado(x, q.tema, acertou);
      x.recentes.push(q.enunciado.slice(0, 140));
      marcarEstudo(x);
      if (!acertou) {
        x.erros.push({ id: novoId(), questao: q, tema: q.tema, criadoEm: hojeBR(), proxima: hojeBR(), acertosSeguidos: 0, vezesErrou: 1, dominada: false, marcou: indice });
      }
    });
  };

  const proxima = () => {
    if (atual + 1 < questoes.length) {
      setAtual(atual + 1);
      window.scrollTo(0, 0);
    } else {
      const acertos = respostas.filter((r) => r.acertou).length;
      atualizar((x) => {
        x.historico.push({ data: hojeBR(), tipo: 'quiz', modo, total: questoes.length, acertos, temas: [...new Set(questoes.map((q) => q.tema))] });
      });
      if (modo === 'semana') prepararQuizDaSemana();
      setFase('fim');
    }
  };

  const perguntar = (q, escolhida) => {
    definirRascunho(perguntaSobreQuestao(q, escolhida));
    navegar('/tutora/nova');
  };

  if (fase === 'carregando') {
    return <main className="tela"><Cabecalho titulo="Quiz" /><Carregando texto="Montando suas questões…" /></main>;
  }

  if (fase === 'respondendo') {
    const q = questoes[atual];
    const respondida = respostas.length > atual;
    return (
      <main className="tela">
        <Cabecalho titulo="Quiz" />
        <div className="progresso" aria-hidden="true"><span style={{ width: `${((atual + (respondida ? 1 : 0)) / questoes.length) * 100}%` }} /></div>
        <Questao key={q.id} questao={q} numero={atual + 1} total={questoes.length}
          respostaInicial={respostas[atual]?.indice}
          aoResponder={(ok, i) => responder(q, ok, i)} aoPerguntar={perguntar}>
          <button className="btn btn-principal" onClick={proxima}>
            {atual + 1 < questoes.length ? 'Próxima questão' : 'Ver resultado'}
          </button>
        </Questao>
      </main>
    );
  }

  if (fase === 'fim') {
    const acertos = respostas.filter((r) => r.acertou).length;
    const taxa = acertos / questoes.length;
    const porTema = {};
    for (const r of respostas) {
      porTema[r.tema] = porTema[r.tema] || { a: 0, t: 0 };
      porTema[r.tema].t++;
      if (r.acertou) porTema[r.tema].a++;
    }
    const parabens = taxa >= 0.7 && RECADOS_PARABENS.length ? RECADOS_PARABENS[Math.floor(Math.random() * RECADOS_PARABENS.length)] : null;
    return (
      <main className="tela">
        <Cabecalho titulo="Resultado" />
        <section className="resultado">
          <p className="placar"><strong>{acertos}</strong><span>de {questoes.length}</span></p>
          <p className="resultado-frase">
            {taxa === 1 ? 'Gabaritou!' : taxa >= 0.7 ? 'Muito bom! Dá pra ver que você está pegando o jeito.' : taxa >= 0.4 ? 'Tá no caminho. Os erros já foram pro caderno pra você revisar.' : 'Esse tema precisa de mais atenção, e tudo bem: é pra isso que serve o treino.'}
          </p>
          {parabens && (
            <div className="recado">
              <Fita cor="rosa" inclinacao={2}>Recado do {ASSINATURA}</Fita>
              <p>{parabens}</p>
            </div>
          )}
          <ul className="lista-resultado">
            {Object.entries(porTema).map(([t, v]) => (
              <li key={t}><span>{t}</span><span className={v.a === v.t ? 'ok' : v.a === 0 ? 'ruim' : ''}>{v.a}/{v.t}</span></li>
            ))}
          </ul>
          <div className="pilha">
            {acertos < questoes.length && <button className="btn btn-principal largo" onClick={() => navegar('/erros/revisar', { substituir: true })}>Revisar os erros agora</button>}
            <button className="btn btn-secundario largo" onClick={() => { setFase('config'); }}>Fazer outro quiz</button>
            <button className="link centro" onClick={() => navegar('/', { substituir: true })}>Voltar pro início</button>
          </div>
        </section>
      </main>
    );
  }

  const fracos = pontosFracos(e);
  const podeComecar = modo === 'semana' ? temSemana : modo === 'tema' ? tema.trim().length > 2 : modo === 'fracos' ? fracos.length > 0 : !!nota;

  return (
    <main className="tela">
      <Cabecalho titulo="Quiz" />
      <section className="pilha">
        <fieldset className="opcoes">
          <legend>Sobre o quê?</legend>
          <label className={`opcao ${modo === 'semana' ? 'marcada' : ''}`}>
            <input type="radio" name="modo" checked={modo === 'semana'} onChange={() => setModo('semana')} />
            <span><strong>Conteúdo da semana</strong><small>{temSemana ? temasDaSemana(e).slice(0, 3).join(', ') : 'Faça o check-in da semana primeiro'}</small></span>
          </label>
          <label className={`opcao ${modo === 'tema' ? 'marcada' : ''}`}>
            <input type="radio" name="modo" checked={modo === 'tema'} onChange={() => setModo('tema')} />
            <span><strong>Um tema que eu escolher</strong><small>Qualquer assunto do curso</small></span>
          </label>
          {fracos.length > 0 && (
            <label className={`opcao ${modo === 'fracos' ? 'marcada' : ''}`}>
              <input type="radio" name="modo" checked={modo === 'fracos'} onChange={() => setModo('fracos')} />
              <span><strong>Meus pontos fracos</strong><small>{fracos.slice(0, 3).join(', ')}</small></span>
            </label>
          )}
          {nota && (
            <label className={`opcao ${modo === 'nota' ? 'marcada' : ''}`}>
              <input type="radio" name="modo" checked={modo === 'nota'} onChange={() => setModo('nota')} />
              <span><strong>Da anotação "{nota.titulo}"</strong><small>Questões só sobre o que você anotou</small></span>
            </label>
          )}
        </fieldset>

        {modo === 'tema' && (
          <label className="campo">
            <span>Qual tema?</span>
            <input value={tema} onChange={(ev) => setTema(ev.target.value)} placeholder="Ex.: cálculo de insulina, curativos, ética" />
          </label>
        )}

        <div className="campo">
          <span>Quantas questões?</span>
          <div className="segmentos">
            {[5, 10].map((n) => <button key={n} className={quantidade === n ? 'ativo' : ''} onClick={() => setQuantidade(n)}>{n}</button>)}
          </div>
        </div>
        <div className="campo">
          <span>Dificuldade</span>
          <div className="segmentos">
            {NIVEIS.map(([v, r]) => <button key={v} className={nivel === v ? 'ativo' : ''} onClick={() => setNivel(v)}>{r}</button>)}
          </div>
        </div>

        <Aviso aoFechar={() => setErro('')}>{erro}</Aviso>
        <button className="btn btn-principal largo" disabled={!podeComecar} onClick={comecar}>Começar</button>
        {!temSemana && modo === 'semana' && <button className="link centro" onClick={() => navegar('/checkin')}>Fazer o check-in da semana</button>}

        <button className="cartao cartao-acao suave" onClick={() => navegar('/erros')}>
          <Icone nome="quiz" />
          <span><strong>Caderno de erros</strong><small>{e.erros.filter((x) => !x.dominada).length} questões guardadas pra revisão</small></span>
        </button>
      </section>
    </main>
  );
}
