import { useEffect } from 'react';
import { errosHoje, semanaAtual, sequencia, useEstado } from '../estado.js';
import { ASSINATURA, RECADOS } from '../config.js';
import { diaDaSemanaBR, diasEntre, formatarData, hojeBR, horaBR, textoFaltam } from '../shared/datas.js';
import { proximasAvaliacoes } from '../shared/lembretes.js';
import { Fita, Icone, navegar } from '../components/base.jsx';
import { prepararQuizDaSemana } from '../quizDados.js';
import { useInstalacao } from '../instalar.js';
import { Contador } from '../components/efeitos.jsx';

function saudacao() {
  const h = horaBR();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Hoje() {
  const e = useEstado();
  const hoje = hojeBR();
  const semana = semanaAtual(e);
  const revisar = errosHoje(e).length;
  const provas = proximasAvaliacoes(e, hoje).slice(0, 3);
  const dias = sequencia(e);
  const dow = diaDaSemanaBR();
  const recado = RECADOS.length ? RECADOS[Number(hoje.replaceAll('-', '')) % RECADOS.length] : null;
  const { podeInstalar, instalar } = useInstalacao();
  const estudouHoje = e.diasEstudo.includes(hoje);

  useEffect(() => { if (semana) prepararQuizDaSemana(); }, [semana]);

  return (
    <main className="tela hoje">
      <header className="hoje-topo">
        <div>
          <p className="hoje-data">{formatarData(hoje)}</p>
          <h1 className="hoje-saudacao">{saudacao()}{e.perfil.nome ? `, ${e.perfil.nome}` : ''}</h1>
        </div>
        <button className="btn-icone" onClick={() => navegar('/ajustes')} aria-label="Ajustes">
          <Icone nome="ajustes" />
        </button>
      </header>

      <div className={`sequencia ${estudouHoje ? 'feito' : ''}`}>
        <Icone nome="fogo" tamanho={20} />
        {dias > 0
          ? <span><strong>{dias} {dias === 1 ? 'dia' : 'dias'}</strong> seguidos estudando{estudouHoje ? '' : '. Estuda hoje pra não perder.'}</span>
          : <span>Comece sua sequência de estudos hoje</span>}
      </div>

      {podeInstalar && (
        <section className="cartao cartao-instalar">
          <p><strong>Coloque o app na tela inicial</strong> pra abrir como um app normal e receber os lembretes.</p>
          <button className="btn btn-principal" onClick={instalar}>Instalar no celular</button>
        </section>
      )}

      {!semana ? (
        <section className="cartao cartao-checkin">
          <Fita inclinacao={-2}>Check-in da semana</Fita>
          <h2>O que você vai ver no curso essa semana?</h2>
          <p>Me conta do seu jeito: escrevendo, falando ou mandando foto do slide ou do cronograma. Aí o quiz, a tutora e as revisões ficam todos sobre isso.</p>
          <button className="btn btn-claro" onClick={() => navegar('/checkin')}>Fazer o check-in</button>
        </section>
      ) : (
        <section className="cartao cartao-semana">
          <div className="linha-entre">
            <Fita inclinacao={-2}>Essa semana no curso</Fita>
            <button className="link" onClick={() => navegar('/checkin')}>Editar</button>
          </div>
          <ul className="lista-temas">
            {semana.temas.map((t, i) => (
              <li key={i}><span className="materia">{t.materia}</span>{t.tema}</li>
            ))}
          </ul>
          <button className="btn btn-principal largo" onClick={() => navegar('/quiz?modo=semana&auto=1')}>
            Fazer o quiz da semana
          </button>
          <p className="nota-baixo">5 questões: a maioria sobre essa semana, e algumas revisando o que já passou.</p>
        </section>
      )}

      {recado && (
        <section className="recado">
          <Fita cor="rosa" inclinacao={2}>Recado do {ASSINATURA}</Fita>
          <p>{recado}</p>
        </section>
      )}

      {revisar > 0 && (
        <button className="cartao cartao-acao" onClick={() => navegar('/erros/revisar')}>
          <span className="numero-grande"><Contador ate={revisar} duracao={600} /></span>
          <span>
            <strong>{revisar === 1 ? 'questão pra revisar hoje' : 'questões pra revisar hoje'}</strong>
            <small>Do seu caderno de erros. Acertando, elas voltam cada vez mais espaçadas.</small>
          </span>
        </button>
      )}

      {provas.length > 0 && (
        <section className="bloco">
          <h2 className="bloco-titulo">Próximas avaliações</h2>
          <ul className="lista-provas">
            {provas.map((p) => {
              const d = diasEntre(hoje, p.data);
              return (
                <li key={p.id}>
                  <button onClick={() => navegar(`/agenda/${p.id}`)} className={d <= 2 ? 'perto' : ''}>
                    <span className="prova-dias">{d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : <>{d}<small> dias</small></>}</span>
                    <span><strong>{p.titulo}</strong><small>{formatarData(p.data)}, {textoFaltam(d)}</small></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {semana && (dow === 3 || dow === 4) && (
        <button className="cartao cartao-acao suave" onClick={() => navegar('/tutora/nova?sugestao=duvida-aula')}>
          <Icone nome="tutora" />
          <span><strong>Ficou alguma dúvida das aulas dessa semana?</strong><small>Pergunta pra tutora antes que vire bola de neve.</small></span>
        </button>
      )}

      <section className="bloco">
        <h2 className="bloco-titulo">Atalhos</h2>
        <div className="atalhos">
          <button onClick={() => navegar('/tutora/nova')}><Icone nome="tutora" /><span>Tirar uma dúvida</span></button>
          <button onClick={() => navegar('/quiz')}><Icone nome="quiz" /><span>Quiz de outro tema</span></button>
          <button onClick={() => navegar('/notas/nova')}><Icone nome="notas" /><span>Nova anotação</span></button>
          <button onClick={() => navegar('/agenda/nova')}><Icone nome="agenda" /><span>Marcar prova</span></button>
        </div>
      </section>
    </main>
  );
}
