import { useEffect, useMemo, useState } from 'react';
import { reduzMovimento } from './base.jsx';

// Número que sobe de 0 até o valor (placar do quiz).
export function Contador({ ate, duracao = 900 }) {
  const [n, setN] = useState(reduzMovimento() ? ate : 0);
  useEffect(() => {
    if (reduzMovimento() || ate === 0) { setN(ate); return undefined; }
    let quadro;
    const inicio = performance.now() + 250;
    const passo = (agora) => {
      const t = Math.min(1, Math.max(0, (agora - inicio) / duracao));
      setN(Math.round(ate * (1 - (1 - t) ** 3)));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [ate, duracao]);
  return <>{n}</>;
}

// Chuva de confete e coraçõezinhos quando ela vai bem.
const CORES = ['#a98bf0', '#7a52e0', '#f6c25b', '#f29bb8', '#bca3f7', '#ffffff'];
export function Confete({ quantidade = 34 }) {
  const pedacos = useMemo(() => Array.from({ length: quantidade }, (_, i) => ({
    esquerda: Math.random() * 100,
    atraso: Math.random() * 0.5,
    duracao: 1.6 + Math.random() * 1.2,
    giro: (Math.random() * 720 - 360).toFixed(0),
    deriva: (Math.random() * 120 - 60).toFixed(0),
    cor: CORES[i % CORES.length],
    coracao: i % 5 === 0,
    tamanho: 7 + Math.random() * 7,
  })), [quantidade]);
  if (reduzMovimento()) return null;
  return (
    <div className="confete" aria-hidden="true">
      {pedacos.map((p, i) => (
        <span key={i} className={p.coracao ? 'coracao' : ''} style={{
          left: `${p.esquerda}%`,
          '--atraso': `${p.atraso}s`,
          '--duracao': `${p.duracao}s`,
          '--giro': `${p.giro}deg`,
          '--deriva': `${p.deriva}px`,
          '--cor': p.cor,
          '--tam': `${p.tamanho}px`,
        }}>{p.coracao ? '♥' : ''}</span>
      ))}
    </div>
  );
}
