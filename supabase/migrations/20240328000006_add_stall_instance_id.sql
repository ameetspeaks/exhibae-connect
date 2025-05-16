-- Check if column exists before adding
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'stall_applications' 
                   AND column_name = 'stall_instance_id') THEN
        -- Add stall_instance_id column to stall_applications table
        alter table "public"."stall_applications"
        add column "stall_instance_id" uuid references "public"."stall_instances" ("id") on delete set null;

        -- Create index for faster lookups
        create index stall_applications_stall_instance_id_idx on "public"."stall_applications" ("stall_instance_id");
    END IF;
END $$;

-- Update trigger to handle stall instance status
create or replace function update_stall_status()
returns trigger as $$
begin
    if NEW.status = 'approved' then
        -- Update stall status
        update "public"."stalls"
        set status = 'applied'
        where id = NEW.stall_id;
        
        -- Update stall instance status if it exists
        if NEW.stall_instance_id is not null then
            update "public"."stall_instances"
            set status = 'applied'
            where id = NEW.stall_instance_id;
        end if;
    elsif OLD.status = 'approved' and NEW.status = 'rejected' then
        -- Update stall status
        update "public"."stalls"
        set status = 'available'
        where id = NEW.stall_id;
        
        -- Update stall instance status if it exists
        if NEW.stall_instance_id is not null then
            update "public"."stall_instances"
            set status = 'available'
            where id = NEW.stall_instance_id;
        end if;
    end if;
    return NEW;
end;
$$ language plpgsql security definer; 