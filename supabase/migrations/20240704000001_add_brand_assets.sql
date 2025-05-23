-- Create storage bucket for brand assets
insert into storage.buckets (id, name, public)
values ('brand_assets', 'brand_assets', true);

-- Allow authenticated users to upload files to their own folder
create policy "Allow authenticated users to upload brand assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'brand_assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own files
create policy "Allow authenticated users to read their own brand assets"
on storage.objects for select
to authenticated
using (
  bucket_id = 'brand_assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
create policy "Allow authenticated users to delete their own brand assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'brand_assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to brand assets
create policy "Allow public read access to brand assets"
on storage.objects for select
to public
using (bucket_id = 'brand_assets');

-- Create table for brand look books
create table if not exists public.brand_lookbooks (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_type text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create table for brand gallery
create table if not exists public.brand_gallery (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references auth.users(id) on delete cascade,
  title text,
  description text,
  image_url text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies for brand_lookbooks
alter table public.brand_lookbooks enable row level security;

create policy "Users can view any brand's lookbooks"
on public.brand_lookbooks for select
to authenticated
using (true);

create policy "Users can manage their own lookbooks"
on public.brand_lookbooks for all
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid());

-- Add RLS policies for brand_gallery
alter table public.brand_gallery enable row level security;

create policy "Users can view any brand's gallery"
on public.brand_gallery for select
to authenticated
using (true);

create policy "Users can manage their own gallery"
on public.brand_gallery for all
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid()); 