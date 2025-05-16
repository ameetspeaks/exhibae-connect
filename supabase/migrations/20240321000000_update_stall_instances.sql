-- Add layout JSON column to exhibitions
alter table "public"."exhibitions"
add column if not exists "layout_config" jsonb;

-- Update stall_instances status options
alter table "public"."stall_instances"
drop constraint if exists stall_instances_status_check,
add constraint stall_instances_status_check 
check (status in ('available', 'pending', 'booked', 'under_maintenance'));

-- Add price column to stall_instances for individual pricing
alter table "public"."stall_instances"
add column if not exists "price" decimal(10,2),
add column if not exists "original_price" decimal(10,2);

-- Create function to copy stall price on instance creation
create or replace function copy_stall_price_to_instance()
returns trigger as $$
begin
    NEW.price := (select price from stalls where id = NEW.stall_id);
    NEW.original_price := NEW.price;
    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically copy price
create trigger copy_stall_price_on_insert
    before insert on "public"."stall_instances"
    for each row
    execute function copy_stall_price_to_instance();

-- Add policies for price updates
create policy "organizers_can_update_stall_instance_price"
    on "public"."stall_instances"
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

-- Function to update stall status based on application
create or replace function update_stall_instance_status()
returns trigger as $$
begin
    if NEW.status = 'approved' then
        update "public"."stall_instances"
        set status = 'booked'
        where stall_id = NEW.stall_id
        and instance_number = (
            select instance_number 
            from "public"."stall_instances" 
            where id = NEW.stall_instance_id
        );
    elsif OLD.status = 'approved' and NEW.status = 'rejected' then
        update "public"."stall_instances"
        set status = 'available'
        where stall_id = NEW.stall_id
        and instance_number = (
            select instance_number 
            from "public"."stall_instances" 
            where id = NEW.stall_instance_id
        );
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for status updates
create trigger update_stall_instance_status_on_application
    after update of status
    on "public"."stall_applications"
    for each row
    execute function update_stall_instance_status(); 