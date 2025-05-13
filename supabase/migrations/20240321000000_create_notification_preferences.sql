-- Create a function to handle timestamp updates
create or replace function update_timestamp()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

-- Create notification_preferences table
create table "public"."notification_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null references "public"."profiles" ("id") on delete cascade,
    "email_notifications" boolean not null default true,
    "application_updates" boolean not null default true,
    "marketing_emails" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    primary key ("id"),
    unique ("user_id")
);

-- Create index for faster lookups
create index notification_preferences_user_id_idx on "public"."notification_preferences" ("user_id");

-- Enable Row Level Security
alter table "public"."notification_preferences" enable row level security;

-- Create policies
-- Users can view their own notification preferences
create policy "users_can_view_own_preferences"
    on "public"."notification_preferences"
    for select
    using (auth.uid() = user_id);

-- Users can update their own notification preferences
create policy "users_can_update_own_preferences"
    on "public"."notification_preferences"
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Users can insert their own notification preferences
create policy "users_can_insert_own_preferences"
    on "public"."notification_preferences"
    for insert
    with check (auth.uid() = user_id);

-- Create trigger to update updated_at
create trigger handle_updated_at before update
    on "public"."notification_preferences"
    for each row
    execute function update_timestamp(); 