-- =====================================================================
-- ליגת הפוצ'יוולי – משחק ניחושים
-- סכמה ראשונית: טבלאות, פונקציות, הרשאות (RLS)
-- =====================================================================

-- ---------------------------------------------------------------------
-- משתמשים
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

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
begin
  if char_length(v_name) < 2 then
    v_name := v_name || '_' || substr(new.id::text, 1, 4);
  end if;
  insert into public.profiles (id, display_name) values (new.id, left(v_name, 30));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- עונה, קבוצות, שחקנים
-- ---------------------------------------------------------------------
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  -- עד מתי אפשר לשנות את ניחוש הטבלה
  table_deadline timestamptz,
  -- ניקוד (ניתן לשינוי ע"י המנהל)
  pts_winner int not null default 2,          -- פגיעה בזוכה
  pts_exact int not null default 5,           -- תוצאה מדויקת (סה"כ, במקום נקודות הזוכה)
  pts_table_position int not null default 3,  -- לכל קבוצה במיקום הנכון
  quad_multiplier numeric not null default 2, -- מכפיל לשחקן ברביעייה
  captain_multiplier numeric not null default 4, -- מכפיל לקפטן
  created_at timestamptz not null default now()
);

create unique index seasons_one_active on public.seasons (is_active) where is_active;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  name text not null,
  logo_url text,
  -- המיקום הסופי בסוף העונה הסדירה (מוזן ע"י המנהל)
  final_position int check (final_position between 1 and 30),
  created_at timestamptz not null default now(),
  unique (season_id, name)
);

create unique index teams_final_position_unique
  on public.teams (season_id, final_position) where final_position is not null;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- מחזורים ומשחקים
-- ---------------------------------------------------------------------
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  number int not null,
  name text,
  stage text not null default 'regular' check (stage in ('regular', 'playoff', 'final_four', 'relegation')),
  -- עד מתי אפשר לשנות ניחושים ורביעייה במחזור זה
  deadline timestamptz not null,
  created_at timestamptz not null default now(),
  unique (season_id, number)
);

-- מערכה אחת עד 21, ניצחון בהפרש 2, תקרה ב-25 (נקודת זהב ב-24:24)
create or replace function public.is_valid_set_score(a int, b int)
returns boolean
language sql
immutable
as $$
  select a is not null and b is not null and a >= 0 and b >= 0 and a <> b and (
    (greatest(a, b) = 21 and least(a, b) <= 19)
    or (greatest(a, b) between 22 and 24 and least(a, b) = greatest(a, b) - 2)
    or (greatest(a, b) = 25 and least(a, b) between 23 and 24)
  );
$$;

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  home_team_id uuid not null references public.teams (id) on delete cascade,
  away_team_id uuid not null references public.teams (id) on delete cascade,
  starts_at timestamptz,
  sort_order int not null default 0,
  home_score int,
  away_score int,
  created_at timestamptz not null default now(),
  check (home_team_id <> away_team_id),
  check (
    (home_score is null and away_score is null)
    or public.is_valid_set_score(home_score, away_score)
  )
);

create index matches_round_idx on public.matches (round_id, sort_order);

-- ניקוד פנטזי לשחקן במחזור (מוזן ע"י המנהל)
create table public.player_round_points (
  player_id uuid not null references public.players (id) on delete cascade,
  round_id uuid not null references public.rounds (id) on delete cascade,
  points numeric not null default 0,
  primary key (player_id, round_id)
);

-- ---------------------------------------------------------------------
-- ניחושים
-- ---------------------------------------------------------------------
create table public.match_predictions (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  home_score int not null,
  away_score int not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id),
  check (public.is_valid_set_score(home_score, away_score))
);

create table public.table_predictions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  season_id uuid not null references public.seasons (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  position int not null,
  primary key (user_id, season_id, team_id),
  unique (user_id, season_id, position)
);

create table public.quad_picks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  round_id uuid not null references public.rounds (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  is_captain boolean not null default false,
  primary key (user_id, round_id, player_id)
);

create unique index quad_one_captain on public.quad_picks (user_id, round_id) where is_captain;

-- ---------------------------------------------------------------------
-- ליגות פרטיות
-- ---------------------------------------------------------------------
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

create or replace function public.add_league_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.league_members (league_id, user_id) values (new.id, new.owner_id);
  return new;
end;
$$;

create trigger on_league_created
  after insert on public.leagues
  for each row execute function public.add_league_owner();

-- ---------------------------------------------------------------------
-- פונקציות RPC
-- ---------------------------------------------------------------------

-- הצטרפות לליגה עם קוד הזמנה
create or replace function public.join_league(p_code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_league_id uuid;
begin
  if auth.uid() is null then
    raise exception 'יש להתחבר';
  end if;
  select id into v_league_id from public.leagues where invite_code = upper(trim(p_code));
  if v_league_id is null then
    raise exception 'קוד ליגה לא נמצא';
  end if;
  insert into public.league_members (league_id, user_id)
  values (v_league_id, auth.uid())
  on conflict do nothing;
  return v_league_id;
end;
$$;

-- שמירת ניחוש טבלה (מערך קבוצות לפי הסדר: מקום 1 ראשון)
create or replace function public.save_table_prediction(p_season_id uuid, p_team_ids uuid[])
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_deadline timestamptz;
  v_team_count int;
begin
  if auth.uid() is null then
    raise exception 'יש להתחבר';
  end if;

  select table_deadline into v_deadline from public.seasons where id = p_season_id;
  if v_deadline is not null and now() >= v_deadline then
    raise exception 'הזמן לניחוש הטבלה עבר';
  end if;

  select count(*) into v_team_count from public.teams where season_id = p_season_id;
  if coalesce(array_length(p_team_ids, 1), 0) <> v_team_count
     or (select count(distinct t) from unnest(p_team_ids) t) <> v_team_count
     or exists (
       select 1 from unnest(p_team_ids) t
       where not exists (select 1 from public.teams where id = t and season_id = p_season_id)
     ) then
    raise exception 'יש לדרג את כל הקבוצות בדיוק פעם אחת';
  end if;

  delete from public.table_predictions where user_id = auth.uid() and season_id = p_season_id;
  insert into public.table_predictions (user_id, season_id, team_id, position)
  select auth.uid(), p_season_id, t.team_id, t.pos
  from unnest(p_team_ids) with ordinality as t(team_id, pos);
end;
$$;

-- שמירת רביעיית מחזור + קפטן
create or replace function public.save_quad(p_round_id uuid, p_player_ids uuid[], p_captain_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_deadline timestamptz;
  v_season_id uuid;
begin
  if auth.uid() is null then
    raise exception 'יש להתחבר';
  end if;

  select deadline, season_id into v_deadline, v_season_id from public.rounds where id = p_round_id;
  if v_deadline is null then
    raise exception 'מחזור לא נמצא';
  end if;
  if now() >= v_deadline then
    raise exception 'הזמן לבחירת רביעייה במחזור זה עבר';
  end if;

  if coalesce(array_length(p_player_ids, 1), 0) <> 4
     or (select count(distinct p) from unnest(p_player_ids) p) <> 4 then
    raise exception 'יש לבחור בדיוק 4 שחקנים שונים';
  end if;

  if not (p_captain_id = any (p_player_ids)) then
    raise exception 'הקפטן חייב להיות אחד מארבעת השחקנים';
  end if;

  if exists (
    select 1 from unnest(p_player_ids) p
    where not exists (
      select 1 from public.players pl
      join public.teams t on t.id = pl.team_id
      where pl.id = p and t.season_id = v_season_id and pl.is_active
    )
  ) then
    raise exception 'שחקן לא תקין';
  end if;

  delete from public.quad_picks where user_id = auth.uid() and round_id = p_round_id;
  insert into public.quad_picks (user_id, round_id, player_id, is_captain)
  select auth.uid(), p_round_id, p, p = p_captain_id
  from unnest(p_player_ids) p;
end;
$$;

-- טבלת דירוג (כללית, או לליגה פרטית)
create or replace function public.get_leaderboard(p_season_id uuid, p_league_id uuid default null)
returns table (
  user_id uuid,
  display_name text,
  match_points numeric,
  table_points numeric,
  quad_points numeric,
  total numeric,
  rank bigint
)
language sql
stable
security definer set search_path = public
as $$
  with s as (
    select * from public.seasons where id = p_season_id
  ),
  users as (
    select p.id, p.display_name
    from public.profiles p
    where p_league_id is null
       or (
         public.is_league_member(p_league_id)
         and exists (select 1 from public.league_members lm where lm.league_id = p_league_id and lm.user_id = p.id)
       )
  ),
  mp as (
    select pr.user_id,
      sum(
        case
          when pr.home_score = m.home_score and pr.away_score = m.away_score then s.pts_exact
          when sign(pr.home_score - pr.away_score) = sign(m.home_score - m.away_score) then s.pts_winner
          else 0
        end
      ) as pts
    from public.match_predictions pr
    join public.matches m on m.id = pr.match_id
    join public.rounds r on r.id = m.round_id
    cross join s
    where r.season_id = p_season_id and m.home_score is not null
    group by pr.user_id
  ),
  tp as (
    select tpr.user_id, count(*) * max(s.pts_table_position) as pts
    from public.table_predictions tpr
    join public.teams t on t.id = tpr.team_id and t.final_position = tpr.position
    cross join s
    where tpr.season_id = p_season_id
    group by tpr.user_id
  ),
  qp as (
    select q.user_id,
      sum(prp.points * case when q.is_captain then s.captain_multiplier else s.quad_multiplier end) as pts
    from public.quad_picks q
    join public.rounds r on r.id = q.round_id
    join public.player_round_points prp on prp.player_id = q.player_id and prp.round_id = q.round_id
    cross join s
    where r.season_id = p_season_id
    group by q.user_id
  )
  select
    u.id,
    u.display_name,
    coalesce(mp.pts, 0),
    coalesce(tp.pts, 0),
    coalesce(qp.pts, 0),
    coalesce(mp.pts, 0) + coalesce(tp.pts, 0) + coalesce(qp.pts, 0) as total,
    rank() over (order by coalesce(mp.pts, 0) + coalesce(tp.pts, 0) + coalesce(qp.pts, 0) desc)
  from users u
  left join mp on mp.user_id = u.id
  left join tp on tp.user_id = u.id
  left join qp on qp.user_id = u.id
  order by total desc, u.display_name;
$$;

-- ---------------------------------------------------------------------
-- הרשאות
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.rounds enable row level security;
alter table public.matches enable row level security;
alter table public.player_round_points enable row level security;
alter table public.match_predictions enable row level security;
alter table public.table_predictions enable row level security;
alter table public.quad_picks enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- פרופילים: כולם רואים שמות, כל אחד מעדכן רק את השם שלו (לא את is_admin)
create policy "profiles readable" on public.profiles for select using (true);
create policy "update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- נתוני ליגה: קריאה לכולם, כתיבה למנהל בלבד
do $$
declare
  t text;
begin
  foreach t in array array['seasons', 'teams', 'players', 'rounds', 'matches', 'player_round_points']
  loop
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ניחושי משחקים: עריכה עד הדדליין של המחזור; ניחושים של אחרים נחשפים אחרי הדדליין
create or replace function public.round_is_open_for_match(p_match_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.matches m
    join public.rounds r on r.id = m.round_id
    where m.id = p_match_id and now() < r.deadline
  );
$$;

create policy "read own or locked predictions" on public.match_predictions for select
  using (user_id = auth.uid() or not public.round_is_open_for_match(match_id));
create policy "insert own open predictions" on public.match_predictions for insert
  with check (user_id = auth.uid() and public.round_is_open_for_match(match_id));
create policy "update own open predictions" on public.match_predictions for update
  using (user_id = auth.uid() and public.round_is_open_for_match(match_id))
  with check (user_id = auth.uid() and public.round_is_open_for_match(match_id));
create policy "delete own open predictions" on public.match_predictions for delete
  using (user_id = auth.uid() and public.round_is_open_for_match(match_id));

-- ניחוש טבלה: שמירה דרך save_table_prediction; נחשף לאחרים אחרי הדדליין
create policy "read own or locked table" on public.table_predictions for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.seasons s
      where s.id = season_id and s.table_deadline is not null and now() >= s.table_deadline
    )
  );

-- רביעייה: שמירה דרך save_quad; נחשפת לאחרים אחרי הדדליין
create policy "read own or locked quad" on public.quad_picks for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.rounds r where r.id = round_id and now() >= r.deadline)
  );

-- ליגות פרטיות
create policy "members read league" on public.leagues for select
  using (owner_id = auth.uid() or public.is_league_member(id));
create policy "create league" on public.leagues for insert
  with check (owner_id = auth.uid());
create policy "owner updates league" on public.leagues for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner deletes league" on public.leagues for delete
  using (owner_id = auth.uid());

create policy "members read members" on public.league_members for select
  using (public.is_league_member(league_id));
create policy "leave league or owner removes" on public.league_members for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.leagues l where l.id = league_id and l.owner_id = auth.uid())
  );

grant execute on function public.join_league(text) to authenticated;
grant execute on function public.save_table_prediction(uuid, uuid[]) to authenticated;
grant execute on function public.save_quad(uuid, uuid[], uuid) to authenticated;
grant execute on function public.get_leaderboard(uuid, uuid) to anon, authenticated;
