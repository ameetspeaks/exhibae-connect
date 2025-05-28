-- Drop existing policies if they exist
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow authenticated updates" on storage.objects;
drop policy if exists "Allow authenticated deletes" on storage.objects;
drop policy if exists "Allow public read" on storage.objects;

-- Create the storage bucket (if it doesn't exist)
insert into storage.buckets (id, name, public)
values ('sliders', 'sliders', true)
on conflict (id) do update set public = true;

-- Allow authenticated users to upload files
create policy "Allow authenticated uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'sliders');

-- Allow authenticated users to update their files
create policy "Allow authenticated updates"
on storage.objects
for update
to authenticated
using (bucket_id = 'sliders');

-- Allow authenticated users to delete their files
create policy "Allow authenticated deletes"
on storage.objects
for delete
to authenticated
using (bucket_id = 'sliders');

-- Allow public to read files
create policy "Allow public read"
on storage.objects
for select
to public
using (bucket_id = 'sliders'); 