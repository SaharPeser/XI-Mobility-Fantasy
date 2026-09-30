-- תמונות שחקנים: עמודה לכתובת התמונה + דלי אחסון ציבורי שרק מנהל יכול לכתוב אליו

alter table public.players
  add column if not exists photo_url text;

-- דלי ציבורי לקריאה, עד 1MB לקובץ, תמונות בלבד
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-photos', 'player-photos', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "player photos public read" on storage.objects;
create policy "player photos public read" on storage.objects for select
  using (bucket_id = 'player-photos');

drop policy if exists "player photos admin insert" on storage.objects;
create policy "player photos admin insert" on storage.objects for insert
  with check (bucket_id = 'player-photos' and public.is_admin());

drop policy if exists "player photos admin update" on storage.objects;
create policy "player photos admin update" on storage.objects for update
  using (bucket_id = 'player-photos' and public.is_admin())
  with check (bucket_id = 'player-photos' and public.is_admin());

drop policy if exists "player photos admin delete" on storage.objects;
create policy "player photos admin delete" on storage.objects for delete
  using (bucket_id = 'player-photos' and public.is_admin());
