// Comunicação do app com o servidor (funções da pasta /api).
const CHAVE_CODIGO = 'jaleco:codigo';

export const getCodigo = () => localStorage.getItem(CHAVE_CODIGO) || '';
export const setCodigo = (c) => localStorage.setItem(CHAVE_CODIGO, c.trim());

const SEM_INTERNET = 'Sem conexão com a internet. Confere o Wi-Fi ou os dados móveis e tenta de novo.';

async function pedir(metodo, url, corpo) {
  let r;
  try {
    r = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'x-app-pin': getCodigo() },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error(SEM_INTERNET);
  }
  let dados;
  try {
    dados = await r.json();
  } catch {
    throw new Error(r.status === 404 ? 'O servidor do app não foi encontrado.' : 'O servidor não respondeu direito. Tenta de novo.');
  }
  if (!r.ok) {
    const e = new Error(dados.erro || 'Algo deu errado.');
    e.status = r.status;
    throw e;
  }
  return dados;
}

export const get = (url) => pedir('GET', url);
export const put = (url, corpo) => pedir('PUT', url, corpo);
export const post = (url, corpo) => pedir('POST', url, corpo);

export const ia = (acao, dados = {}) => post('/api/ai', { acao, ...dados });

// Chat com resposta aparecendo aos poucos.
export async function iaChat(dados, aoReceber, sinal) {
  let r;
  try {
    r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-pin': getCodigo() },
      body: JSON.stringify({ acao: 'chat', ...dados }),
      signal: sinal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error(SEM_INTERNET);
  }
  if (!r.ok) {
    let msg = 'A tutora não conseguiu responder agora.';
    try { msg = (await r.json()).erro || msg; } catch { /* resposta sem JSON */ }
    throw new Error(msg);
  }
  const leitor = r.body.getReader();
  const dec = new TextDecoder();
  let texto = '';
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    texto += dec.decode(value, { stream: true });
    aoReceber(texto);
  }
  return texto;
}
