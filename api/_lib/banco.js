// Acesso ao banco (Supabase) pela API REST, sem bibliotecas extras.
// Tabela usada: app_state (id text primary key, data jsonb, updated_at timestamptz)
import { readFile, writeFile } from 'node:fs/promises';

const URL_BASE = () => (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const CHAVE = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ARQUIVO_DEV = process.env.DEV_STORE_FILE; // só para testes locais

export function bancoConfigurado() {
  return !!ARQUIVO_DEV || (!!URL_BASE() && !!CHAVE());
}

function cabecalhos(extra = {}) {
  const chave = CHAVE();
  const h = { apikey: chave, 'Content-Type': 'application/json', ...extra };
  // Chaves antigas (service_role) são JWT e também vão no Authorization
  if (chave.startsWith('eyJ')) h.Authorization = `Bearer ${chave}`;
  return h;
}

async function lerArquivoDev() {
  try { return JSON.parse(await readFile(ARQUIVO_DEV, 'utf8')); } catch { return {}; }
}

export async function lerRegistro(id) {
  if (ARQUIVO_DEV) {
    const tudo = await lerArquivoDev();
    return tudo[id] || null;
  }
  const r = await fetch(`${URL_BASE()}/rest/v1/app_state?id=eq.${encodeURIComponent(id)}&select=data,updated_at`, {
    headers: cabecalhos(),
  });
  if (!r.ok) throw new Error(`Banco respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const linhas = await r.json();
  return linhas[0] ? { data: linhas[0].data, updatedAt: linhas[0].updated_at } : null;
}

export async function salvarRegistro(id, data) {
  const updatedAt = new Date().toISOString();
  if (ARQUIVO_DEV) {
    const tudo = await lerArquivoDev();
    tudo[id] = { data, updatedAt };
    await writeFile(ARQUIVO_DEV, JSON.stringify(tudo));
    return updatedAt;
  }
  const r = await fetch(`${URL_BASE()}/rest/v1/app_state`, {
    method: 'POST',
    headers: cabecalhos({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify([{ id, data, updated_at: updatedAt }]),
  });
  if (!r.ok) throw new Error(`Banco respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return updatedAt;
}
