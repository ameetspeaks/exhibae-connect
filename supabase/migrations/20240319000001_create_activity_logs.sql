create table if not exists public.activity_logs (
    id uuid default gen_random_uuid() primary key,
    action text not null,
    target text not null,
    actor_id uuid references auth.users(id),
    timestamp timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Set up RLS policies
alter table public.activity_logs enable row level security;

create policy "Activity logs are viewable by managers"
    on public.activity_logs for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'manager'
        )
    );

-- Create function to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Create trigger for updated_at
create trigger handle_activity_logs_updated_at
    before update on public.activity_logs
    for each row
    execute procedure public.handle_updated_at(); 