-- Bewertungen für die Website. Einmal im Supabase-Dashboard unter "SQL Editor" ausführen.
-- Gleiches Supabase-Projekt wie die RCU-App (gleiche Konten). Mehrfach ausführen schadet nicht.
--
-- Ablauf: Angemeldete Nutzer schreiben eine Bewertung (eine pro Konto). Sie ist erst öffentlich,
-- wenn Rilkio sie freigibt: Table Editor -> reviews -> Spalte "approved" auf true setzen.
-- Ändert jemand seine Bewertung, muss sie erneut freigegeben werden.

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 2 and 24),
  rating smallint not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 10 and 600),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Freigegebene Bewertungen lesen" on public.reviews;
create policy "Freigegebene Bewertungen lesen" on public.reviews
  for select using (approved or auth.uid() = user_id);

drop policy if exists "Eigene Bewertung schreiben" on public.reviews;
create policy "Eigene Bewertung schreiben" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id and approved = false);

drop policy if exists "Eigene Bewertung ändern" on public.reviews;
create policy "Eigene Bewertung ändern" on public.reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Eigene Bewertung löschen" on public.reviews;
create policy "Eigene Bewertung löschen" on public.reviews
  for delete to authenticated using (auth.uid() = user_id);

-- Nutzer dürfen nur Name, Sterne und Text setzen, nie "approved"
revoke all on public.reviews from anon, authenticated;
grant select (id, user_id, name, rating, text, approved, created_at) on public.reviews to anon, authenticated;
grant insert (name, rating, text) on public.reviews to authenticated;
grant update (name, rating, text) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

-- Geänderte Bewertung muss neu freigegeben werden (gilt nicht für Änderungen im Dashboard)
create or replace function public.reviews_reset_approval()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and auth.uid() = old.user_id
     and (new.text is distinct from old.text or new.rating is distinct from old.rating or new.name is distinct from old.name) then
    new.approved := false;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists reviews_reset_approval on public.reviews;
create trigger reviews_reset_approval
  before update on public.reviews
  for each row execute function public.reviews_reset_approval();
