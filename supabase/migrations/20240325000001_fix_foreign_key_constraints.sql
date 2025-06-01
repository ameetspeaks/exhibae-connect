-- Fix brand_statistics foreign key
ALTER TABLE IF EXISTS public.brand_statistics
    DROP CONSTRAINT IF EXISTS brand_statistics_brand_id_fkey;

ALTER TABLE IF EXISTS public.brand_statistics
    ADD CONSTRAINT brand_statistics_brand_id_fkey
    FOREIGN KEY (brand_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Fix subscriptions foreign key
ALTER TABLE IF EXISTS public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE IF EXISTS public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Fix contact_messages foreign key
ALTER TABLE IF EXISTS public.contact_messages
    DROP CONSTRAINT IF EXISTS contact_messages_responded_by_fkey;

ALTER TABLE IF EXISTS public.contact_messages
    ADD CONSTRAINT contact_messages_responded_by_fkey
    FOREIGN KEY (responded_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- Fix conversations foreign key (if not already cascading)
ALTER TABLE IF EXISTS public.conversations
    DROP CONSTRAINT IF EXISTS conversations_brand_id_fkey,
    DROP CONSTRAINT IF EXISTS conversations_organiser_id_fkey;

ALTER TABLE IF EXISTS public.conversations
    ADD CONSTRAINT conversations_brand_id_fkey
    FOREIGN KEY (brand_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
    ADD CONSTRAINT conversations_organiser_id_fkey
    FOREIGN KEY (organiser_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Fix ticket_activities foreign key
ALTER TABLE IF EXISTS public.ticket_activities
    DROP CONSTRAINT IF EXISTS ticket_activities_user_id_fkey;

ALTER TABLE IF EXISTS public.ticket_activities
    ADD CONSTRAINT ticket_activities_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Fix chat_messages foreign key
ALTER TABLE IF EXISTS public.chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

ALTER TABLE IF EXISTS public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Fix support_tickets foreign keys
ALTER TABLE IF EXISTS public.support_tickets
    DROP CONSTRAINT IF EXISTS fk_support_tickets_created_by,
    DROP CONSTRAINT IF EXISTS fk_support_tickets_user,
    DROP CONSTRAINT IF EXISTS fk_support_tickets_assigned_to;

ALTER TABLE IF EXISTS public.support_tickets
    ADD CONSTRAINT fk_support_tickets_created_by
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL,
    ADD CONSTRAINT fk_support_tickets_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
    ADD CONSTRAINT fk_support_tickets_assigned_to
    FOREIGN KEY (assigned_to)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- Grant necessary permissions
GRANT ALL ON public.brand_statistics TO authenticated;
GRANT ALL ON public.brand_statistics TO service_role;
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.ticket_activities TO authenticated;
GRANT ALL ON public.ticket_activities TO service_role;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role; 