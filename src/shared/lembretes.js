// Monta o lembrete diário (usado pela notificação do servidor).
import { chaveSemana, diasEntre, diaDaSemanaBR, hojeBR } from './datas.js';

export function errosParaRevisar(estado, hoje) {
  return (estado.erros || []).filter((e) => !e.dominada && (!e.proxima || e.proxima <= hoje));
}

export function proximasAvaliacoes(estado, hoje) {
  return (estado.avaliacoes || [])
    .filter((a) => !a.feito && a.data && diasEntre(hoje, a.data) >= 0)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function montarLembrete(estado, recados = [], agora = new Date()) {
  if (!estado) return null;
  const hoje = hojeBR(agora);
  const dow = diaDaSemanaBR(agora);
  const nome = estado.perfil?.nome ? `, ${estado.perfil.nome}` : '';
  const linhas = [];
  let url = '/';
  let titulo = 'Hora de estudar' + nome;

  const prox = proximasAvaliacoes(estado, hoje);
  const prova = prox[0];
  if (prova) {
    const dias = diasEntre(hoje, prova.data);
    if (dias === 0) {
      titulo = `Hoje é dia de ${prova.titulo}!`;
      linhas.push('Você se preparou pra isso. Respira e confia. 💪');
      url = `/#/agenda/${prova.id}`;
    } else if (dias === 1) {
      titulo = `Amanhã: ${prova.titulo}`;
      linhas.push('Que tal um quiz rápido de revisão hoje?');
      url = `/#/agenda/${prova.id}`;
    } else if (dias <= 7) {
      linhas.push(`Faltam ${dias} dias pra ${prova.titulo}.`);
    }
  }

  const semana = chaveSemana(hoje);
  const temCheckin = !!estado.semanas?.[semana];
  if (!temCheckin && (dow === 0 || dow === 1 || dow === 2)) {
    linhas.unshift('Check-in da semana: o que você vai ver no curso essa semana?');
    if (!prova || diasEntre(hoje, prova.data) > 1) url = '/#/checkin';
  }

  const erros = errosParaRevisar(estado, hoje).length;
  if (erros > 0) {
    linhas.push(`${erros} ${erros === 1 ? 'questão' : 'questões'} do caderno de erros pra revisar.`);
  }

  if (dow === 3 && temCheckin) {
    linhas.push('Ficou alguma dúvida das aulas? A tutora te ajuda.');
  }

  const estudouHoje = (estado.diasEstudo || []).includes(hoje);
  if (linhas.length === 0) {
    if (estudouHoje) return null; // já estudou e não há nada pendente: não incomoda
    linhas.push('Bora fazer 5 questões? Leva uns 5 minutinhos.');
  }

  if (recados.length && !prova) {
    const i = Number(hoje.replaceAll('-', '')) % recados.length;
    linhas.push(recados[i]);
  }

  return { title: titulo, body: linhas.slice(0, 3).join('\n'), url };
}
