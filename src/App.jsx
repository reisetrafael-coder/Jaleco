import { useState } from 'react';
import { getCodigo } from './api.js';
import { useEstado } from './estado.js';
import { Icone, navegar, useRota } from './components/base.jsx';
import { Entrada } from './screens/Entrada.jsx';
import { Hoje } from './screens/Hoje.jsx';
import { Checkin } from './screens/Checkin.jsx';
import { Quiz } from './screens/Quiz.jsx';
import { Erros } from './screens/Erros.jsx';
import { Tutora } from './screens/Tutora.jsx';
import { Notas } from './screens/Notas.jsx';
import { Agenda } from './screens/Agenda.jsx';
import { Ajustes } from './screens/Ajustes.jsx';

const ABAS = [
  ['/', 'hoje', 'Hoje'],
  ['/quiz', 'quiz', 'Quiz'],
  ['/tutora', 'tutora', 'Tutora'],
  ['/notas', 'notas', 'Notas'],
  ['/agenda', 'agenda', 'Agenda'],
];

const TELAS = { checkin: Checkin, quiz: Quiz, erros: Erros, tutora: Tutora, notas: Notas, agenda: Agenda, ajustes: Ajustes };

export function App() {
  const [entrou, setEntrou] = useState(!!getCodigo());
  const { partes } = useRota();
  useEstado();
  if (!entrou) return <Entrada aoEntrar={() => setEntrou(true)} />;

  const raiz = partes[0] || '';
  const Tela = TELAS[raiz] || Hoje;
  const emConversa = raiz === 'tutora' && partes[1];
  const ativa = raiz === 'erros' ? 'quiz' : raiz === 'checkin' || raiz === 'ajustes' ? null : raiz;

  return (
    <>
      <Tela />
      {!emConversa && (
        <nav className="abas" aria-label="Seções do app">
          {ABAS.map(([caminho, icone, rotulo]) => {
            const ehAtiva = ativa === caminho.slice(1);
            return (
              <button key={caminho} className={ehAtiva ? 'ativa' : ''} aria-current={ehAtiva ? 'page' : undefined}
                onClick={() => navegar(caminho, { substituir: true })}>
                <Icone nome={icone} />
                <span>{rotulo}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
