-- סמלי קבוצות: דלי אחסון ציבורי שרק מנהל יכול לכתוב אליו (הכתובת נשמרת ב-teams.logo_url הקיימת)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-logos', 'team-logos', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "team logos public read" on storage.objects;
create policy "team logos public read" on storage.objects for select
  using (bucket_id = 'team-logos');

drop policy if exists "team logos admin insert" on storage.objects;
create policy "team logos admin insert" on storage.objects for insert
  with check (bucket_id = 'team-logos' and public.is_admin());

drop policy if exists "team logos admin update" on storage.objects;
create policy "team logos admin update" on storage.objects for update
  using (bucket_id = 'team-logos' and public.is_admin())
  with check (bucket_id = 'team-logos' and public.is_admin());

drop policy if exists "team logos admin delete" on storage.objects;
create policy "team logos admin delete" on storage.objects for delete
  using (bucket_id = 'team-logos' and public.is_admin());
