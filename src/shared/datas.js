// Funções de data usadas pelo app e pelo servidor (sempre no horário de Brasília).
const FUSO = 'America/Sao_Paulo';

export function hojeBR(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

// 0 = domingo ... 6 = sábado
export function diaDaSemanaBR(d = new Date()) {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short' }).format(d);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(s);
}

export function horaBR(d = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: FUSO, hour: 'numeric', hour12: false }).format(d)) % 24;
}

function partes(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m - 1, d];
}

// Semana de estudo, de domingo a sábado (o check-in de domingo à noite já vale
// para a semana que começa), ex.: "2026-S48"
export function chaveSemana(iso) {
  const d = new Date(Date.UTC(...partes(iso)));
  d.setUTCDate(d.getUTCDate() + 1);
  const diaNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaNum);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(semana).padStart(2, '0')}`;
}

export function diasEntre(deIso, ateIso) {
  return Math.round((Date.UTC(...partes(ateIso)) - Date.UTC(...partes(deIso))) / 86400000);
}

export function somarDias(iso, n) {
  const d = new Date(Date.UTC(...partes(iso)));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatarData(iso, comDiaSemana = true) {
  if (!iso) return '';
  const d = new Date(Date.UTC(...partes(iso), 12));
  const t = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: comDiaSemana ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
  }).format(d).replace(/\.$/, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function textoFaltam(dias) {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias < 0) return dias === -1 ? 'foi ontem' : `foi há ${-dias} dias`;
  return `em ${dias} dias`;
}
