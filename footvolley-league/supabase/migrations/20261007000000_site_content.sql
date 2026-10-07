-- תוכן אתר שהמנהל עורך (תקנון ומדיניות פרטיות), ותיעוד ההסכמה לתקנון בהרשמה

create table if not exists public.site_content (
  key text primary key check (key in ('terms', 'privacy')),
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "public read" on public.site_content;
create policy "public read" on public.site_content for select using (true);

drop policy if exists "admin write" on public.site_content;
create policy "admin write" on public.site_content for all
  using (public.is_admin()) with check (public.is_admin());

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;

-- מתי המשתמש הסכים לתקנון (נשמר בהרשמה; משתמשים ותיקים נשארים ריקים)
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

-- יצירת הפרופיל בהרשמה, עכשיו גם עם תאריך ההסכמה לתקנון
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'שחקן'
  );
  v_terms timestamptz;
begin
  if char_length(v_name) < 2 then
    v_name := v_name || '_' || substr(new.id::text, 1, 4);
  end if;
  begin
    v_terms := (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz;
  exception when others then
    v_terms := null;
  end;
  insert into public.profiles (id, display_name, terms_accepted_at)
  values (new.id, left(v_name, 30), v_terms);
  return new;
end;
$$;
