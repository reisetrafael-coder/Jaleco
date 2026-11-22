import { useEffect, useRef, useState } from 'react';
import { ia } from '../api.js';
import { atualizar, marcarEstudo, semanaAtual, useEstado } from '../estado.js';
import { formatarData, hojeBR } from '../shared/datas.js';
import { novoId } from '../util.js';
import { Aviso, BotaoFoto, Cabecalho, Carregando, Icone, Microfone, navegar, Texto, useRota } from '../components/base.jsx';

export function Notas() {
  const { partes } = useRota();
  if (partes[1]) return <Editor key={partes[1]} id={partes[1]} />;
  return <Lista />;
}

function Lista() {
  const e = useEstado();
  const [busca, setBusca] = useState('');
  const [lendoFoto, setLendoFoto] = useState(false);
  const [erro, setErro] = useState('');
  const termo = busca.trim().toLowerCase();
  const notas = [...e.notas]
    .filter((n) => !termo || `${n.titulo} ${n.materia} ${n.texto}`.toLowerCase().includes(termo))
    .sort((a, b) => (b.editadoEm || '').localeCompare(a.editadoEm || ''));
  const grupos = {};
  for (const n of notas) (grupos[n.materia || 'Sem matéria'] = grupos[n.materia || 'Sem matéria'] || []).push(n);

  const daFoto = async (img) => {
    setErro('');
    setLendoFoto(true);
    try {
      const r = await ia('foto_nota', { imagem: img });
      const id = novoId();
      atualizar((x) => {
        x.notas.push({ id, titulo: r.titulo, materia: r.materia, texto: r.texto, criadoEm: hojeBR(), editadoEm: new Date().toISOString() });
        marcarEstudo(x);
      });
      navegar(`/notas/${id}`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLendoFoto(false);
    }
  };

  if (lendoFoto) return <main className="tela"><Cabecalho titulo="Anotações" /><Carregando texto="Lendo a foto e organizando…" /></main>;

  return (
    <main className="tela">
      <header className="tela-topo">
        <h1>Anotações</h1>
        <button className="btn btn-principal" onClick={() => navegar('/notas/nova')}><Icone nome="mais" tamanho={18} /> Nova</button>
      </header>
      <div className="pilha">
        <div className="linha-botoes">
          <BotaoFoto comTexto rotulo="Foto do caderno vira anotação" aoEscolher={daFoto} aoErro={setErro} />
        </div>
        <Aviso aoFechar={() => setErro('')}>{erro}</Aviso>
        {e.notas.length > 3 && (
          <input className="busca" type="search" value={busca} onChange={(ev) => setBusca(ev.target.value)} placeholder="Buscar nas anotações" aria-label="Buscar nas anotações" />
        )}
        {e.notas.length === 0 ? (
          <div className="vazio">
            <p><strong>Nenhuma anotação ainda.</strong></p>
            <p>Escreva, dite pelo microfone ou tire foto do caderno. Depois a tutora resume e cria questões a partir dela.</p>
          </div>
        ) : (
          Object.entries(grupos).map(([materia, lista]) => (
            <div key={materia} className="grupo">
              <h2 className="bloco-titulo">{materia}</h2>
              <ul className="lista-simples clicavel">
                {lista.map((n) => (
                  <li key={n.id}>
                    <button onClick={() => navegar(`/notas/${n.id}`)}>
                      <p>{n.titulo || 'Sem título'}</p>
                      <small>{n.texto.replace(/[#*_`-]/g, '').slice(0, 90)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function Editor({ id: idRota }) {
  const e = useEstado();
  const nova = idRota === 'nova';
  const [id] = useState(() => (nova ? novoId() : idRota));
  const existente = e.notas.find((n) => n.id === id);
  const [titulo, setTitulo] = useState(existente?.titulo || '');
  const [materia, setMateria] = useState(existente?.materia || '');
  const [texto, setTexto] = useState(existente?.texto || '');
  const [modo, setModo] = useState(nova || !existente?.texto ? 'editar' : 'ler');
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const timer = useRef(null);

  const materias = [...new Set([...e.notas.map((n) => n.materia), ...(semanaAtual(e)?.temas || []).map((t) => t.materia)].filter(Boolean))];

  // Salva sozinho enquanto ela escreve.
  useEffect(() => {
    if (!titulo.trim() && !texto.trim()) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      atualizar((x) => {
        const n = x.notas.find((y) => y.id === id);
        const dados = { titulo: titulo.trim() || texto.trim().split('\n')[0].slice(0, 50), materia: materia.trim(), texto, editadoEm: new Date().toISOString() };
        if (n) Object.assign(n, dados);
        else { x.notas.push({ id, criadoEm: hojeBR(), ...dados }); marcarEstudo(x); }
      });
    }, 700);
    return () => clearTimeout(timer.current);
  }, [titulo, materia, texto, id]);

  if (!nova && !existente) {
    return <main className="tela"><Cabecalho titulo="Anotação" voltarPara="/notas" /><div className="vazio"><p>Essa anotação não existe mais.</p></div></main>;
  }

  const resumir = async () => {
    setErro('');
    setCarregando(true);
    try {
      const r = await ia('resumo', { titulo, texto });
      setResumo(r.texto);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const apagar = () => {
    if (!window.confirm('Apagar essa anotação? Não dá pra desfazer.')) return;
    clearTimeout(timer.current);
    atualizar((x) => { x.notas = x.notas.filter((n) => n.id !== id); });
    navegar('/notas', { substituir: true });
  };

  const salvo = !!e.notas.find((n) => n.id === id);

  return (
    <main className="tela">
      <Cabecalho titulo={nova && !salvo ? 'Nova anotação' : 'Anotação'} voltarPara="/notas"
        acao={salvo && <button className="btn-icone" onClick={apagar} aria-label="Apagar anotação"><Icone nome="lixo" /></button>} />
      <section className="pilha">
        <input className="titulo-nota" value={titulo} onChange={(ev) => setTitulo(ev.target.value)} placeholder="Título" aria-label="Título" />
        <input list="materias" value={materia} onChange={(ev) => setMateria(ev.target.value)} placeholder="Matéria (ex.: Farmacologia)" aria-label="Matéria" />
        <datalist id="materias">{materias.map((m) => <option key={m} value={m} />)}</datalist>

        <div className="segmentos pequeno">
          <button className={modo === 'editar' ? 'ativo' : ''} onClick={() => setModo('editar')}>Escrever</button>
          <button className={modo === 'ler' ? 'ativo' : ''} onClick={() => setModo('ler')} disabled={!texto.trim()}>Ler</button>
        </div>

        {modo === 'editar' ? (
          <div className="caixa-escrever">
            <textarea className="texto-nota" value={texto} onChange={(ev) => setTexto(ev.target.value)} rows={14}
              placeholder={'Escreva sua anotação.\nDica: use - no começo da linha pra fazer lista e **assim** pra negrito.'} />
            <div className="caixa-ferramentas">
              <Microfone rotulo="Ditar" aoFalar={(t) => setTexto((x) => (x ? `${x}${x.endsWith('\n') ? '' : ' '}${t}` : t))} />
            </div>
          </div>
        ) : (
          <div className="cartao"><Texto>{texto}</Texto></div>
        )}

        {salvo && <p className="nota-baixo">Salvo automaticamente.</p>}
        <Aviso aoFechar={() => setErro('')}>{erro}</Aviso>

        {texto.trim().length > 40 && (
          <div className="linha-botoes">
            <button className="btn btn-secundario" onClick={resumir} disabled={carregando}>{carregando ? 'Resumindo…' : 'Resumir com a tutora'}</button>
            <button className="btn btn-secundario" disabled={!salvo} onClick={() => navegar(`/quiz?nota=${id}`)}>Criar quiz desta anotação</button>
          </div>
        )}

        {resumo && (
          <div className="cartao cartao-resumo">
            <Texto>{resumo}</Texto>
            <div className="linha-botoes">
              <button className="btn btn-principal" onClick={() => { setTexto((x) => `${x}\n\n## Resumo\n${resumo}`); setResumo(null); setModo('ler'); }}>Juntar à anotação</button>
              <button className="link" onClick={() => setResumo(null)}>Descartar</button>
            </div>
          </div>
        )}
        {existente?.criadoEm && <p className="nota-baixo">Criada em {formatarData(existente.criadoEm)}.</p>}
      </section>
    </main>
  );
}
