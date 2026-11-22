import { useState } from 'react';
import { atualizar, errosHoje, marcarEstudo, registrarResultado, registrarRevisao, useEstado } from '../estado.js';
import { formatarData, hojeBR } from '../shared/datas.js';
import { Cabecalho, navegar, useRota } from '../components/base.jsx';
import { Questao, perguntaSobreQuestao } from '../components/Questao.jsx';
import { definirRascunho } from './Tutora.jsx';
import { Contador } from '../components/efeitos.jsx';

export function Erros() {
  const { partes } = useRota();
  return partes[1] === 'revisar' ? <Revisar /> : <Lista />;
}

function Lista() {
  const e = useEstado();
  const hoje = hojeBR();
  const ativos = e.erros.filter((x) => !x.dominada);
  const dominadas = e.erros.filter((x) => x.dominada).length;
  const paraHoje = errosHoje(e).length;
  const porTema = {};
  for (const x of ativos) (porTema[x.tema] = porTema[x.tema] || []).push(x);

  return (
    <main className="tela">
      <Cabecalho titulo="Caderno de erros" />
      <section className="pilha">
        <p className="intro">Toda questão que você erra vem pra cá. Ela volta pra revisão em 1, 3 e 7 dias. Acertando todas as vezes, ela sai do caderno.</p>
        <div className="placar-linha">
          <div><strong>{paraHoje}</strong><span>pra hoje</span></div>
          <div><strong>{ativos.length}</strong><span>no caderno</span></div>
          <div><strong>{dominadas}</strong><span>dominadas</span></div>
        </div>
        {paraHoje > 0 && <button className="btn btn-principal largo" onClick={() => navegar('/erros/revisar')}>Revisar as {paraHoje} de hoje</button>}

        {ativos.length === 0 ? (
          <div className="vazio">
            <p><strong>Caderno vazio.</strong></p>
            <p>Faça um quiz: as questões que você errar aparecem aqui pra revisão.</p>
            <button className="btn btn-secundario" onClick={() => navegar('/quiz')}>Fazer um quiz</button>
          </div>
        ) : (
          Object.entries(porTema).map(([tema, lista]) => (
            <div key={tema} className="grupo">
              <h2 className="bloco-titulo">{tema} <small>{lista.length}</small></h2>
              <ul className="lista-simples">
                {lista.map((x) => (
                  <li key={x.id}>
                    <p>{x.questao.enunciado}</p>
                    <small>{x.proxima <= hoje ? 'Revisar hoje' : `Próxima revisão: ${formatarData(x.proxima)}`}{x.vezesErrou > 1 ? `. Errou ${x.vezesErrou} vezes.` : ''}</small>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function Revisar() {
  const e = useEstado();
  const [fila] = useState(() => errosHoje(e).map((x) => x.id));
  const [pos, setPos] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [respondida, setRespondida] = useState(false);

  if (!fila.length || pos >= fila.length) {
    return (
      <main className="tela">
        <Cabecalho titulo="Revisão" voltarPara="/erros" />
        <section className="resultado">
          {fila.length ? (
            <>
              <p className="placar"><strong><Contador ate={acertos} /></strong><span>de {fila.length}</span></p>
              <p className="resultado-frase">Revisão de hoje feita. As que você acertou voltam mais pra frente; as que errou voltam amanhã.</p>
            </>
          ) : (
            <p className="resultado-frase">Nada pra revisar hoje. 🎉</p>
          )}
          <button className="btn btn-principal largo" onClick={() => navegar('/', { substituir: true })}>Voltar pro início</button>
        </section>
      </main>
    );
  }

  const erro = e.erros.find((x) => x.id === fila[pos]);
  if (!erro) return null;

  const responder = (acertou) => {
    setRespondida(true);
    if (acertou) setAcertos((a) => a + 1);
    atualizar((x) => {
      const alvo = x.erros.find((y) => y.id === erro.id);
      if (alvo) registrarRevisao(alvo, acertou);
      registrarResultado(x, erro.tema, acertou);
      marcarEstudo(x);
    });
  };

  return (
    <main className="tela">
      <Cabecalho titulo="Revisão" voltarPara="/erros" />
      <div className="progresso" aria-hidden="true"><span style={{ width: `${((pos + (respondida ? 1 : 0)) / fila.length) * 100}%` }} /></div>
      <Questao key={erro.id} questao={erro.questao} numero={pos + 1} total={fila.length} aoResponder={responder}
        aoPerguntar={(q, i) => { definirRascunho(perguntaSobreQuestao(q, i)); navegar('/tutora/nova'); }}>
        <button className="btn btn-principal" onClick={() => { setRespondida(false); setPos(pos + 1); window.scrollTo(0, 0); }}>
          {pos + 1 < fila.length ? 'Próxima' : 'Terminar revisão'}
        </button>
      </Questao>
    </main>
  );
}
