-- פרסי החסות (XIMOBILITY) לשלושת המקומות הראשונים בדירוג הכללי
alter table public.seasons
  add column if not exists prize_1 text,
  add column if not exists prize_2 text,
  add column if not exists prize_3 text;
