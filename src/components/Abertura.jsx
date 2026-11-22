import { useEffect, useState } from 'react';
import { APP_NOME } from '../config.js';
import { Logo } from './Logo.jsx';
import { reduzMovimento } from './base.jsx';

// Tela de abertura: o logo entra, o batimento se desenha, o coração pulsa e a tela se abre.
// Aparece uma vez cada vez que o app é aberto. Um toque pula.
export function Abertura({ aoSair, aoTerminar }) {
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (reduzMovimento()) { aoTerminar(); return undefined; }
    const t1 = setTimeout(() => { setSaindo(true); aoSair?.(); }, 1750);
    const t2 = setTimeout(aoTerminar, 2350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pular = () => {
    if (saindo) return;
    setSaindo(true);
    aoSair?.();
    setTimeout(aoTerminar, 500);
  };

  return (
    <div className={`abertura ${saindo ? 'saindo' : ''}`} onClick={pular} role="presentation">
      <div className="abertura-brilho" aria-hidden="true" />
      <div className="abertura-conteudo">
        <Logo tamanho={112} animado />
        <h1 className="abertura-nome">
          {APP_NOME.split('').map((letra, i) => (
            <span key={i} style={{ '--i': i }}>{letra}</span>
          ))}
        </h1>
        <p className="abertura-frase">seu plantão de estudos</p>
      </div>
    </div>
  );
}
