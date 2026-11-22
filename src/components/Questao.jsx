import { useEffect, useMemo, useRef, useState } from 'react';
import { embaralhar } from '../util.js';
import { Fita, Icone } from './base.jsx';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Mostra uma questão, recebe a resposta e explica por que está certa ou errada.
export function Questao({ questao, numero, total, respostaInicial = null, aoResponder, aoPerguntar, children }) {
  const ordem = useMemo(() => embaralhar(questao.alternativas.map((_, i) => i)), [questao]);
  const [escolhida, setEscolhida] = useState(respostaInicial ?? null);
  const respondida = escolhida !== null;
  const acertou = respondida && questao.alternativas[escolhida].correta;
  const indiceCorreta = questao.alternativas.findIndex((a) => a.correta);
  const refFeedback = useRef(null);
  const jaVeioRespondida = useRef(respostaInicial != null);
  useEffect(() => {
    if (respondida && !jaVeioRespondida.current) refFeedback.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [respondida]);

  const responder = (i) => {
    if (respondida) return;
    setEscolhida(i);
    aoResponder?.(questao.alternativas[i].correta, i);
  };

  return (
    <article className="questao">
      <div className="questao-topo">
        <Fita>{questao.tema}</Fita>
        {total > 1 && <span className="questao-contagem">{numero} de {total}</span>}
      </div>
      <p className="questao-enunciado">{questao.enunciado}</p>
      <ol className="alternativas">
        {ordem.map((i, pos) => {
          const alt = questao.alternativas[i];
          let estado = '';
          if (respondida) {
            if (alt.correta) estado = 'certa';
            else if (i === escolhida) estado = 'errada';
            else estado = 'apagada';
          }
          return (
            <li key={i}>
              <button className={`alternativa ${estado}`} onClick={() => responder(i)} disabled={respondida}
                aria-pressed={i === escolhida}>
                <span className="letra">{estado === 'certa' ? <Icone nome="check" tamanho={16} /> : estado === 'errada' ? <Icone nome="x" tamanho={16} /> : LETRAS[pos]}</span>
                <span>{alt.texto}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {respondida && (
        <div ref={refFeedback} className={`feedback ${acertou ? 'feedback-certo' : 'feedback-errado'}`} aria-live="polite">
          <p className="feedback-titulo">{acertou ? 'Isso! Resposta certa.' : 'Não foi dessa vez.'}</p>
          {!acertou && (
            <p><strong>Por que a sua está errada:</strong> {questao.alternativas[escolhida].explicacao}</p>
          )}
          <p><strong>{acertou ? 'Por quê:' : 'A certa:'}</strong> {questao.alternativas[indiceCorreta].explicacao}</p>
          {questao.dica && <p className="macete"><span>Macete</span>{questao.dica}</p>}
          <div className="feedback-acoes">
            {aoPerguntar && (
              <button className="btn btn-secundario" onClick={() => aoPerguntar(questao, escolhida)}>
                <Icone nome="tutora" tamanho={18} /> Perguntar à tutora
              </button>
            )}
            {children}
          </div>
        </div>
      )}
    </article>
  );
}

// Texto que vai para a tutora quando ela quer entender melhor uma questão.
export function perguntaSobreQuestao(q, escolhida) {
  const alts = q.alternativas.map((a, i) => `${LETRAS[i]}) ${a.texto}${a.correta ? ' (correta)' : ''}`).join('\n');
  const marcou = escolhida != null ? `\nEu marquei: ${q.alternativas[escolhida].texto}` : '';
  return `Não entendi direito essa questão, me explica com calma?\n\n${q.enunciado}\n${alts}${marcou}`;
}
