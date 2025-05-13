-- Create the stall_instances table
create table if not exists stall_instances (
    id uuid primary key default uuid_generate_v4(),
    stall_id uuid not null references stalls(id) on delete cascade,
    exhibition_id uuid not null references exhibitions(id) on delete cascade,
    position_x numeric not null default 0,
    position_y numeric not null default 0,
    rotation_angle numeric not null default 0,
    status text not null default 'available' check (status in ('available', 'reserved', 'booked')),
    instance_number integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table stall_instances enable row level security;

create policy "Organisers can view their exhibition's stall instances"
    on stall_instances for select
    using (
        exhibition_id in (
            select id from exhibitions 
            where organiser_id = auth.uid()
        )
    );

create policy "Organisers can create stall instances for their exhibitions"
    on stall_instances for insert
    with check (
        exhibition_id in (
            select id from exhibitions 
            where organiser_id = auth.uid()
        )
    );

create policy "Organisers can update their stall instances"
    on stall_instances for update
    using (
        exhibition_id in (
            select id from exhibitions 
            where organiser_id = auth.uid()
        )
    );

create policy "Organisers can delete their stall instances"
    on stall_instances for delete
    using (
        exhibition_id in (
            select id from exhibitions 
            where organiser_id = auth.uid()
        )
    );

-- Create indexes
create index stall_instances_stall_id_idx on stall_instances(stall_id);
create index stall_instances_exhibition_id_idx on stall_instances(exhibition_id); 