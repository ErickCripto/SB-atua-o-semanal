-- =====================================================================
-- Mesa de Carteiras · configuração do banco no Supabase
-- Como usar: Supabase › SQL Editor › New query › cole tudo › troque o
-- e-mail na última parte pelo SEU e-mail › Run.
-- Pode rodar de novo sem problema (não apaga dados).
-- =====================================================================

-- Quem pode entrar no site (equipe). Só e-mails desta lista veem os dados.
create table if not exists public.membros (
  email      text primary key,
  nome       text,
  admin      boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- Todos os dados do site (carteiras, anotações, chamados, bases do dia...).
create table if not exists public.docs (
  col         text not null,
  id          text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (col, id)
);
alter table public.docs replica identity full;

-- Versões anteriores: toda alteração ou exclusão guarda a versão antiga aqui.
create table if not exists public.historico (
  hid           bigint generated always as identity primary key,
  col           text not null,
  id            text not null,
  data          jsonb,
  acao          text not null,
  alterado_em   timestamptz not null default now(),
  alterado_por  text
);
create index if not exists historico_quando on public.historico (alterado_em desc);

-- Funções de permissão
create or replace function public.eh_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m where lower(m.email) = lower(auth.jwt() ->> 'email'));
$$;
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m where lower(m.email) = lower(auth.jwt() ->> 'email') and m.admin);
$$;

-- Gatilho: carimba quem alterou e guarda a versão anterior
create or replace function public.docs_carimbo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.col <> 'base' then
    if tg_op = 'DELETE' or old.data is distinct from new.data then
      insert into public.historico (col, id, data, acao, alterado_por)
      values (old.col, old.id, old.data, lower(tg_op), auth.jwt() ->> 'email');
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  new.updated_at := now();
  new.updated_by := auth.jwt() ->> 'email';
  return new;
end $$;
drop trigger if exists docs_carimbo on public.docs;
create trigger docs_carimbo before insert or update or delete on public.docs
  for each row execute function public.docs_carimbo();

-- Regras de acesso (RLS)
alter table public.membros   enable row level security;
alter table public.docs      enable row level security;
alter table public.historico enable row level security;

drop policy if exists membros_ler on public.membros;
create policy membros_ler on public.membros for select to authenticated using (public.eh_membro());
drop policy if exists membros_admin on public.membros;
create policy membros_admin on public.membros for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists docs_membros on public.docs;
create policy docs_membros on public.docs for all to authenticated using (public.eh_membro()) with check (public.eh_membro());

drop policy if exists historico_ler on public.historico;
create policy historico_ler on public.historico for select to authenticated using (public.eh_membro());

-- Atualização ao vivo entre a equipe
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- >>> TROQUE PELO SEU E-MAIL (você vira administrador da equipe) <<<
insert into public.membros (email, nome, admin)
values (lower('seu.email@exemplo.com'), 'Administrador', true)
on conflict (email) do update set admin = true;

-- =====================================================================
-- Só o administrador cria acessos: o cadastro de qualquer e-mail que não
-- esteja na lista da equipe é recusado pelo próprio Supabase.
-- Depois de rodar, ligue em: Authentication › Hooks › Before User Created
-- › Postgres › função hook_antes_de_criar_usuario.
-- =====================================================================
create or replace function public.hook_antes_de_criar_usuario(event jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.membros where lower(email) = lower(event -> 'user' ->> 'email')) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Este e-mail não foi liberado pelo administrador.'));
end $$;
grant execute on function public.hook_antes_de_criar_usuario(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_antes_de_criar_usuario(jsonb) from authenticated, anon, public;
