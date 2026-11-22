import { useState } from 'react';
import { ia } from '../api.js';
import { atualizar, montarContexto, getEstado, useEstado } from '../estado.js';
import { diasEntre, formatarData, hojeBR, textoFaltam } from '../shared/datas.js';
import { novoId } from '../util.js';
import { Aviso, Cabecalho, Carregando, Fita, Icone, navegar, useRota } from '../components/base.jsx';

const TIPOS = [['prova', 'Prova'], ['trabalho', 'Trabalho'], ['estagio', 'Estágio'], ['outro', 'Outro']];
const nomeTipo = (t) => Object.fromEntries(TIPOS)[t] || 'Outro';

export function Agenda() {
  const { partes } = useRota();
  if (partes[1] === 'nova') return <Formulario />;
  if (partes[1]) return <Detalhe key={partes[1]} id={partes[1]} />;
  return <Lista />;
}

function Lista() {
  const e = useEstado();
  const hoje = hojeBR();
  const futuras = e.avaliacoes.filter((a) => !a.feito && a.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
  const passadas = e.avaliacoes.filter((a) => a.feito || a.data < hoje).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10);
  return (
    <main className="tela">
      <header className="tela-topo">
        <h1>Agenda</h1>
        <button className="btn btn-principal" onClick={() => navegar('/agenda/nova')}><Icone nome="mais" tamanho={18} /> Adicionar</button>
      </header>
      <p className="intro">Provas, trabalhos e estágio. O app te lembra nos dias anteriores e monta um plano de revisão.</p>
      {futuras.length === 0 ? (
        <div className="vazio">
          <p><strong>Nada marcado.</strong></p>
          <p>Quando souber a data de uma prova, adicione aqui. Dá pra avisar também no check-in da semana.</p>
        </div>
      ) : (
        <ul className="lista-provas">
          {futuras.map((p) => {
            const d = diasEntre(hoje, p.data);
            return (
              <li key={p.id}>
                <button onClick={() => navegar(`/agenda/${p.id}`)} className={d <= 2 ? 'perto' : ''}>
                  <span className="prova-dias">{d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : <>{d}<small> dias</small></>}</span>
                  <span><strong>{p.titulo}</strong><small>{nomeTipo(p.tipo)}, {formatarData(p.data)}{p.plano ? '. Com plano de revisão.' : ''}</small></span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {passadas.length > 0 && (
        <section className="bloco">
          <h2 className="bloco-titulo">Já passaram</h2>
          <ul className="lista-simples clicavel apagada">
            {passadas.map((p) => (
              <li key={p.id}><button onClick={() => navegar(`/agenda/${p.id}`)}><p>{p.titulo}</p><small>{formatarData(p.data)}</small></button></li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Formulario() {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('prova');
  const [data, setData] = useState('');
  const [temas, setTemas] = useState('');
  const salvar = (ev) => {
    ev.preventDefault();
    const id = novoId();
    atualizar((x) => {
      x.avaliacoes.push({ id, titulo: titulo.trim(), tipo, data, temas: temas.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean), feito: false });
    });
    navegar(`/agenda/${id}`, { substituir: true });
  };
  return (
    <main className="tela">
      <Cabecalho titulo="Nova avaliação" voltarPara="/agenda" />
      <form className="pilha" onSubmit={salvar}>
        <label className="campo"><span>O que é?</span>
          <input value={titulo} onChange={(ev) => setTitulo(ev.target.value)} placeholder="Ex.: Prova de Farmacologia" required />
        </label>
        <div className="campo"><span>Tipo</span>
          <div className="segmentos">
            {TIPOS.map(([v, r]) => <button type="button" key={v} className={tipo === v ? 'ativo' : ''} onClick={() => setTipo(v)}>{r}</button>)}
          </div>
        </div>
        <label className="campo"><span>Data</span>
          <input type="date" value={data} min={hojeBR()} onChange={(ev) => setData(ev.target.value)} required />
        </label>
        <label className="campo"><span>O que vai cair? <small>(opcional, separe por vírgula)</small></span>
          <textarea value={temas} onChange={(ev) => setTemas(ev.target.value)} rows={3} placeholder="Ex.: vias de administração, cálculo de gotejamento, 9 certos" />
        </label>
        <button className="btn btn-principal largo" disabled={!titulo.trim() || !data}>Salvar</button>
      </form>
    </main>
  );
}

function Detalhe({ id }) {
  const e = useEstado();
  const a = e.avaliacoes.find((x) => x.id === id);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  if (!a) return <main className="tela"><Cabecalho titulo="Agenda" voltarPara="/agenda" /><div className="vazio"><p>Essa avaliação não existe mais.</p></div></main>;
  const hoje = hojeBR();
  const d = diasEntre(hoje, a.data);

  const mudar = (fn) => atualizar((x) => { const alvo = x.avaliacoes.find((y) => y.id === id); if (alvo) fn(alvo); });

  const gerarPlano = async () => {
    setErro('');
    setGerando(true);
    try {
      const r = await ia('plano', { titulo: a.titulo, data: a.data, hoje, temas: a.temas, contexto: montarContexto(getEstado()) });
      mudar((x) => { x.plano = { dias: r.dias.map((dia) => ({ data: dia.data, tarefas: dia.tarefas.map((t) => ({ t, ok: false })) })) }; });
    } catch (err) {
      setErro(err.message);
    } finally {
      setGerando(false);
    }
  };

  const apagar = () => {
    if (!window.confirm('Apagar essa avaliação da agenda?')) return;
    atualizar((x) => { x.avaliacoes = x.avaliacoes.filter((y) => y.id !== id); });
    navegar('/agenda', { substituir: true });
  };

  const temasQuiz = a.temas.length ? a.temas.join(', ') : a.titulo;

  return (
    <main className="tela">
      <Cabecalho titulo={nomeTipo(a.tipo)} voltarPara="/agenda"
        acao={<button className="btn-icone" onClick={apagar} aria-label="Apagar"><Icone nome="lixo" /></button>} />
      <section className="pilha">
        <div className="contagem">
          <p className="contagem-numero">{d > 1 ? d : d === 1 ? 'Amanhã' : d === 0 ? 'Hoje' : 'Passou'}</p>
          {d > 1 && <p className="contagem-rotulo">dias</p>}
          <h2>{a.titulo}</h2>
          <p>{formatarData(a.data)}, {textoFaltam(d)}</p>
        </div>

        {a.temas.length > 0 && (
          <div className="cartao">
            <Fita>O que vai cair</Fita>
            <ul className="lista-temas">{a.temas.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        )}

        {!a.feito && d >= 0 && (
          <div className="linha-botoes">
            <button className="btn btn-principal" onClick={() => navegar(`/quiz?modo=tema&tema=${encodeURIComponent(temasQuiz)}`)}>Quiz sobre essa prova</button>
          </div>
        )}

        {!a.feito && d >= 0 && (a.plano ? (
          <div className="cartao">
            <div className="linha-entre"><Fita cor="azul">Plano de revisão</Fita><button className="link" onClick={gerarPlano} disabled={gerando}>Refazer</button></div>
            <ol className="plano">
              {a.plano.dias.map((dia, i) => (
                <li key={dia.data + i} className={dia.data === hoje ? 'hoje' : dia.data < hoje ? 'passado' : ''}>
                  <p className="plano-dia">{dia.data === hoje ? 'Hoje' : formatarData(dia.data)}</p>
                  {dia.tarefas.map((t, j) => (
                    <label key={j} className="checar">
                      <input type="checkbox" checked={t.ok} onChange={(ev) => mudar((x) => { x.plano.dias[i].tarefas[j].ok = ev.target.checked; })} />
                      <span>{t.t}</span>
                    </label>
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ) : gerando ? <Carregando texto="Montando seu plano de revisão…" /> : (
          <button className="cartao cartao-acao suave" onClick={gerarPlano}>
            <Icone nome="agenda" />
            <span><strong>Montar plano de revisão</strong><small>A tutora divide o conteúdo até o dia da prova, com revisões e um simulado na véspera.</small></span>
          </button>
        ))}

        <Aviso aoFechar={() => setErro('')}>{erro}</Aviso>

        <label className="checar destaque">
          <input type="checkbox" checked={!!a.feito} onChange={(ev) => mudar((x) => { x.feito = ev.target.checked; })} />
          <span>Já fiz essa avaliação</span>
        </label>
      </section>
    </main>
  );
}
