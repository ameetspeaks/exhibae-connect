-- Create the payment_proofs storage bucket
insert into storage.buckets (id, name, public)
values ('payment_proofs', 'payment_proofs', true);

-- Allow authenticated users to upload files
create policy "Allow authenticated users to upload payment proofs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment_proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own files
create policy "Allow authenticated users to read their own payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment_proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
create policy "Allow authenticated users to delete their own payment proofs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'payment_proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to payment proofs
create policy "Allow public read access to payment proofs"
on storage.objects for select
to public
using (bucket_id = 'payment_proofs'); 