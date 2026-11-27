-- =====================================================================
-- Liste pense-bête — base de données partagée (Supabase)
-- À coller dans Supabase : SQL Editor → New query → Run.
-- Le script peut être relancé sans risque.
-- =====================================================================

-- ---------- Tables ----------

-- Un foyer = une liste partagée. Le code sert à inviter quelqu'un.
create table if not exists public.foyers (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null default 'Mon foyer',
  code       text not null unique,
  created_at timestamptz not null default now()
);

-- Qui fait partie de quel foyer
create table if not exists public.membres (
  foyer_id   uuid not null references public.foyers(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (foyer_id, user_id)
);

-- La liste en cours : une ligne par tuile
create table if not exists public.articles (
  id         text primary key,
  foyer_id   uuid not null references public.foyers(id) on delete cascade,
  nom        text not null,
  rayon      text not null default 'au',
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_foyer on public.articles (foyer_id);

-- Les achats : sert à « Déjà achetés » et à « Il vous faut peut-être »
create table if not exists public.achats (
  id         text primary key,
  foyer_id   uuid not null references public.foyers(id) on delete cascade,
  nom        text not null,
  rayon      text not null default 'au',
  achete_le  timestamptz not null default now()
);
create index if not exists achats_foyer_date on public.achats (foyer_id, achete_le desc);

-- Réglages communs du foyer : packs, ordre des rayons, rayons corrigés…
create table if not exists public.reglages_foyer (
  foyer_id   uuid primary key references public.foyers(id) on delete cascade,
  donnees    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Sécurité : chacun ne voit que son foyer ----------

create or replace function public.est_membre(f uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from membres where foyer_id = f and user_id = auth.uid());
$$;

alter table public.foyers         enable row level security;
alter table public.membres        enable row level security;
alter table public.articles       enable row level security;
alter table public.achats         enable row level security;
alter table public.reglages_foyer enable row level security;

drop policy if exists "membres voient leur foyer" on public.foyers;
create policy "membres voient leur foyer" on public.foyers
  for select to authenticated using (public.est_membre(id));

drop policy if exists "membres voient les membres" on public.membres;
create policy "membres voient les membres" on public.membres
  for select to authenticated using (public.est_membre(foyer_id));

drop policy if exists "membres gèrent les articles" on public.articles;
create policy "membres gèrent les articles" on public.articles
  for all to authenticated using (public.est_membre(foyer_id)) with check (public.est_membre(foyer_id));

drop policy if exists "membres gèrent les achats" on public.achats;
create policy "membres gèrent les achats" on public.achats
  for all to authenticated using (public.est_membre(foyer_id)) with check (public.est_membre(foyer_id));

drop policy if exists "membres gèrent les réglages" on public.reglages_foyer;
create policy "membres gèrent les réglages" on public.reglages_foyer
  for all to authenticated using (public.est_membre(foyer_id)) with check (public.est_membre(foyer_id));

-- ---------- Créer un foyer / rejoindre un foyer avec un code ----------

create or replace function public.creer_foyer(nom_foyer text default 'Mon foyer')
returns public.foyers
language plpgsql security definer set search_path = public as $$
declare
  f public.foyers;
  c text;
begin
  if auth.uid() is null then raise exception 'Vous devez être connecté.'; end if;
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from foyers where code = c);
  end loop;
  insert into foyers (nom, code) values (coalesce(nullif(trim(nom_foyer), ''), 'Mon foyer'), c) returning * into f;
  insert into membres (foyer_id, user_id) values (f.id, auth.uid());
  insert into reglages_foyer (foyer_id) values (f.id);
  return f;
end $$;

create or replace function public.rejoindre_foyer(code_invitation text)
returns public.foyers
language plpgsql security definer set search_path = public as $$
declare
  f public.foyers;
begin
  if auth.uid() is null then raise exception 'Vous devez être connecté.'; end if;
  select * into f from foyers where code = upper(trim(code_invitation));
  if not found then raise exception 'Code inconnu.'; end if;
  insert into membres (foyer_id, user_id) values (f.id, auth.uid()) on conflict do nothing;
  return f;
end $$;

revoke execute on function public.creer_foyer(text)      from public, anon;
revoke execute on function public.rejoindre_foyer(text)  from public, anon;
revoke execute on function public.est_membre(uuid)       from public, anon;
grant  execute on function public.est_membre(uuid)       to authenticated;
grant  execute on function public.creer_foyer(text)      to authenticated;
grant  execute on function public.rejoindre_foyer(text)  to authenticated;

-- ---------- Temps réel : les changements arrivent tout de suite ----------

do $$
begin
  begin alter publication supabase_realtime add table public.articles;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.achats;         exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.reglages_foyer; exception when duplicate_object then null; end;
end $$;
