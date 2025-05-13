-- Create stall_applications table
create table "public"."stall_applications" (
    "id" uuid not null default gen_random_uuid(),
    "stall_id" uuid not null references "public"."stalls" ("id") on delete cascade,
    "brand_id" uuid not null references "public"."profiles" ("id") on delete cascade,
    "exhibition_id" uuid not null references "public"."exhibitions" ("id") on delete cascade,
    "status" text not null default 'pending'::text check (status in ('pending', 'approved', 'rejected')),
    "message" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    primary key ("id")
);

-- Create index for faster lookups
create index stall_applications_stall_id_idx on "public"."stall_applications" ("stall_id");
create index stall_applications_brand_id_idx on "public"."stall_applications" ("brand_id");
create index stall_applications_exhibition_id_idx on "public"."stall_applications" ("exhibition_id");

-- Enable Row Level Security
alter table "public"."stall_applications" enable row level security;

-- Create policies
-- Organizers can view applications for their exhibitions
create policy "organizers_can_view_applications"
    on "public"."stall_applications"
    for select
    using (
        exists (
            select 1 from "public"."exhibitions" e
            where e.id = "exhibition_id"
            and e.organiser_id = auth.uid()
        )
    );

-- Organizers can update application status
create policy "organizers_can_update_applications"
    on "public"."stall_applications"
    for update
    using (
        exists (
            select 1 from "public"."exhibitions" e
            where e.id = "exhibition_id"
            and e.organiser_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from "public"."exhibitions" e
            where e.id = "exhibition_id"
            and e.organiser_id = auth.uid()
        )
    );

-- Brands can view their own applications
create policy "brands_can_view_own_applications"
    on "public"."stall_applications"
    for select
    using (auth.uid() = brand_id);

-- Brands can create applications
create policy "brands_can_create_applications"
    on "public"."stall_applications"
    for insert
    with check (
        auth.uid() = brand_id
        and exists (
            select 1 from "public"."stalls" s
            where s.id = stall_id
            and s.status = 'available'
        )
    );

-- Brands can delete their pending applications
create policy "brands_can_delete_pending_applications"
    on "public"."stall_applications"
    for delete
    using (
        auth.uid() = brand_id
        and status = 'pending'
    );

-- Create trigger to update updated_at
create trigger handle_updated_at before update
    on "public"."stall_applications"
    for each row
    execute function moddatetime('updated_at');

-- Create trigger to update stall status when application is approved
create or replace function update_stall_status()
returns trigger as $$
begin
    if NEW.status = 'approved' then
        update "public"."stalls"
        set status = 'applied'
        where id = NEW.stall_id;
    elsif OLD.status = 'approved' and NEW.status = 'rejected' then
        update "public"."stalls"
        set status = 'available'
        where id = NEW.stall_id;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

create trigger update_stall_status_on_application
    after update of status
    on "public"."stall_applications"
    for each row
    execute function update_stall_status(); 