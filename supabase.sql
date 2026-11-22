-- Cole tudo isto no SQL Editor do Supabase e clique em "Run".
create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Tranca a tabela: só o servidor do app (com a chave secreta) consegue ler e gravar.
alter table public.app_state enable row level security;
grant all on table public.app_state to service_role;
