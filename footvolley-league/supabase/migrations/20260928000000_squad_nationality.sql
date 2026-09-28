-- שישיית המחזור: לאום לשחקנים, גודל הרכב ומכסת ברזילאים מוגדרים בעונה, ופונקציית שמירה חדשה
-- התוספות לא שוברות את הגרסה הקודמת של האתר: save_quad הישנה נשארת כמו שהיא

-- לאום השחקן: IL = ישראלי, BR = ברזילאי
alter table public.players
  add column if not exists nationality text not null default 'IL' check (nationality in ('IL', 'BR'));

-- גודל ההרכב ומכסת הברזילאים (ניתנים לשינוי בניהול)
alter table public.seasons
  add column if not exists squad_size int not null default 6 check (squad_size between 1 and 12),
  add column if not exists max_brazilians int not null default 3 check (max_brazilians >= 0);

-- שמירת ההרכב של המחזור + קפטן, לפי ההגדרות של העונה
create or replace function public.save_squad(p_round_id uuid, p_player_ids uuid[], p_captain_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_deadline timestamptz;
  v_season_id uuid;
  v_size int;
  v_max_br int;
  v_br int;
begin
  if auth.uid() is null then
    raise exception 'יש להתחבר';
  end if;

  select r.deadline, r.season_id, s.squad_size, s.max_brazilians
    into v_deadline, v_season_id, v_size, v_max_br
  from public.rounds r
  join public.seasons s on s.id = r.season_id
  where r.id = p_round_id;

  if v_deadline is null then
    raise exception 'מחזור לא נמצא';
  end if;
  if now() >= v_deadline then
    raise exception 'הזמן לבחירת ההרכב במחזור זה עבר';
  end if;

  if coalesce(array_length(p_player_ids, 1), 0) <> v_size
     or (select count(distinct p) from unnest(p_player_ids) p) <> v_size then
    raise exception 'יש לבחור בדיוק % שחקנים שונים', v_size;
  end if;

  if not (p_captain_id = any (p_player_ids)) then
    raise exception 'הקפטן חייב להיות אחד מהשחקנים בהרכב';
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

  select count(*) into v_br
  from public.players
  where id = any (p_player_ids) and nationality = 'BR';
  if v_br > v_max_br then
    raise exception 'אפשר לבחור לכל היותר % ברזילאים', v_max_br;
  end if;

  delete from public.quad_picks where user_id = auth.uid() and round_id = p_round_id;
  insert into public.quad_picks (user_id, round_id, player_id, is_captain)
  select auth.uid(), p_round_id, p, p = p_captain_id
  from unnest(p_player_ids) p;
end;
$$;

grant execute on function public.save_squad(uuid, uuid[], uuid) to authenticated;
