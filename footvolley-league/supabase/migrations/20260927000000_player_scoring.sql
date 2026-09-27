-- ניקוד אישי לשחקנים: נתונים לכל משחק, מצטיין מחזור וחישוב אוטומטי של ניקוד המחזור (לרביעייה)

-- ---------------------------------------------------------------------
-- הגדרות ניקוד אישי בעונה (ניתנות לשינוי בניהול)
-- ערכי העונשין נשמרים כמספר חיובי ומופחתים בחישוב
-- ---------------------------------------------------------------------
alter table public.seasons
  add column if not exists ppts_played numeric not null default 1,          -- השתתפות במשחק
  add column if not exists ppts_win numeric not null default 3,             -- ניצחון
  add column if not exists ppts_crushing_win numeric not null default 2,    -- ניצחון מוחץ (בנוסף לניצחון)
  add column if not exists crushing_margin int not null default 7,          -- הפרש מינימלי לניצחון מוחץ
  add column if not exists ppts_block numeric not null default 1,           -- לכל חסימה
  add column if not exists ppts_great_defense numeric not null default 2,   -- לכל פעולת הגנה מדהימה
  add column if not exists ppts_match_mvp numeric not null default 4,       -- מצטיין המשחק
  add column if not exists ppts_round_mvp numeric not null default 5,       -- מצטיין המחזור (בנוסף)
  add column if not exists ppts_scored_8 numeric not null default 2,        -- 8 נקודות ומעלה במערכה
  add column if not exists ppts_scored_14 numeric not null default 4,       -- 14 נקודות ומעלה (במקום 8+)
  add column if not exists ppts_overtime numeric not null default 1,        -- המשחק הגיע להארכה (20:20)
  add column if not exists ppts_yellow numeric not null default 2,          -- כרטיס צהוב (מופחת)
  add column if not exists ppts_red numeric not null default 5,             -- כרטיס אדום (מופחת)
  add column if not exists ppts_unforced_error numeric not null default 1,  -- לכל טעות בלתי מחויבת (מופחת)
  add column if not exists quad_multiply_negative boolean not null default true; -- האם להכפיל גם ניקוד שלילי ברביעייה

-- מצטיין המחזור
alter table public.rounds
  add column if not exists mvp_player_id uuid references public.players (id) on delete set null;

-- ---------------------------------------------------------------------
-- נתוני שחקן במשחק (שורה = השחקן שיחק במשחק)
-- ---------------------------------------------------------------------
create table public.match_player_stats (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  blocks int not null default 0 check (blocks >= 0),
  great_defense int not null default 0 check (great_defense >= 0),
  unforced_errors int not null default 0 check (unforced_errors >= 0),
  -- 0 = פחות מ-8 נקודות אישיות, 1 = 8 ומעלה, 2 = 14 ומעלה
  scored_tier smallint not null default 0 check (scored_tier between 0 and 2),
  is_mvp boolean not null default false,
  yellow_card boolean not null default false,
  red_card boolean not null default false,
  primary key (match_id, player_id)
);

create unique index match_player_stats_one_mvp on public.match_player_stats (match_id) where is_mvp;

create or replace function public.check_match_player_team()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.matches m
    join public.players p on p.id = new.player_id
    where m.id = new.match_id and p.team_id in (m.home_team_id, m.away_team_id)
  ) then
    raise exception 'השחקן לא שייך לאף אחת מהקבוצות במשחק';
  end if;
  return new;
end;
$$;

create trigger match_player_stats_team_check
  before insert or update on public.match_player_stats
  for each row execute function public.check_match_player_team();

alter table public.match_player_stats enable row level security;
create policy "public read" on public.match_player_stats for select using (true);
create policy "admin write" on public.match_player_stats for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- חישוב ניקוד
-- ---------------------------------------------------------------------

-- ניקוד שחקן במשחק בודד
create view public.player_match_points with (security_invoker = true) as
select
  st.match_id,
  st.player_id,
  m.round_id,
  r.season_id,
  (
    s.ppts_played
    + case
        when m.home_score is null then 0
        when (p.team_id = m.home_team_id) = (m.home_score > m.away_score) then
          s.ppts_win
          + case when abs(m.home_score - m.away_score) >= s.crushing_margin then s.ppts_crushing_win else 0 end
        else 0
      end
    + case when greatest(m.home_score, m.away_score) >= 22 then s.ppts_overtime else 0 end
    + st.blocks * s.ppts_block
    + st.great_defense * s.ppts_great_defense
    + case when st.is_mvp then s.ppts_match_mvp else 0 end
    + case st.scored_tier when 2 then s.ppts_scored_14 when 1 then s.ppts_scored_8 else 0 end
    - case when st.yellow_card then s.ppts_yellow else 0 end
    - case when st.red_card then s.ppts_red else 0 end
    - st.unforced_errors * s.ppts_unforced_error
  ) as points
from public.match_player_stats st
join public.matches m on m.id = st.match_id
join public.rounds r on r.id = m.round_id
join public.seasons s on s.id = r.season_id
join public.players p on p.id = st.player_id;

-- ניקוד שחקן במחזור = משחקים + מצטיין המחזור + תיקון ידני (player_round_points)
create view public.player_round_scores with (security_invoker = true) as
with parts as (
  select player_id, round_id, season_id, points from public.player_match_points
  union all
  select r.mvp_player_id, r.id, r.season_id, s.ppts_round_mvp
  from public.rounds r
  join public.seasons s on s.id = r.season_id
  where r.mvp_player_id is not null
  union all
  select prp.player_id, prp.round_id, r.season_id, prp.points
  from public.player_round_points prp
  join public.rounds r on r.id = prp.round_id
)
select player_id, round_id, season_id, sum(points) as points
from parts
group by player_id, round_id, season_id;

grant select on public.player_match_points, public.player_round_scores to anon, authenticated;

-- הדירוג: הרביעייה מחושבת עכשיו מ-player_round_scores (אותו מבנה פלט)
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
      sum(
        prs.points * case
          when prs.points < 0 and not s.quad_multiply_negative then 1
          when q.is_captain then s.captain_multiplier
          else s.quad_multiplier
        end
      ) as pts
    from public.quad_picks q
    join public.player_round_scores prs on prs.player_id = q.player_id and prs.round_id = q.round_id
    cross join s
    where prs.season_id = p_season_id
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
