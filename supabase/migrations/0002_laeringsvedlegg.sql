-- Private originalvedlegg. Kjør før skyopplasting tas i bruk.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('laeringsvedlegg', 'laeringsvedlegg', false, 26214400,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "les egne laeringsvedlegg" on storage.objects;
create policy "les egne laeringsvedlegg" on storage.objects for select to authenticated
using (bucket_id = 'laeringsvedlegg' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "last opp egne laeringsvedlegg" on storage.objects;
create policy "last opp egne laeringsvedlegg" on storage.objects for insert to authenticated
with check (bucket_id = 'laeringsvedlegg' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "rydd egne laeringsvedlegg" on storage.objects;
create policy "rydd egne laeringsvedlegg" on storage.objects for delete to authenticated
using (bucket_id = 'laeringsvedlegg' and (storage.foldername(name))[1] = auth.uid()::text);
