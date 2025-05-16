-- Create functions and triggers
BEGIN;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create ticket activity logging function
CREATE OR REPLACE FUNCTION public.log_ticket_activity()
RETURNS TRIGGER AS $$
DECLARE
    _ticket RECORD;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        SELECT * INTO _ticket FROM public.support_tickets WHERE id = NEW.id;
        IF NOT FOUND THEN
            RETURN NULL;
        END IF;

        -- Log status change
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            INSERT INTO public.ticket_activities (
                ticket_id,
                user_id,
                activity_type,
                description,
                metadata
            ) VALUES (
                NEW.id,
                auth.uid(),
                'status_change',
                format('Status changed from %s to %s', OLD.status, NEW.status),
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
            );
        END IF;

        -- Log priority change
        IF NEW.priority IS DISTINCT FROM OLD.priority THEN
            INSERT INTO public.ticket_activities (
                ticket_id,
                user_id,
                activity_type,
                description,
                metadata
            ) VALUES (
                NEW.id,
                auth.uid(),
                'priority_change',
                format('Priority changed from %s to %s', OLD.priority, NEW.priority),
                jsonb_build_object('old_priority', OLD.priority, 'new_priority', NEW.priority)
            );
        END IF;

        -- Log assignment change
        IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
            INSERT INTO public.ticket_activities (
                ticket_id,
                user_id,
                activity_type,
                description,
                metadata
            ) VALUES (
                NEW.id,
                auth.uid(),
                'assignment_change',
                'Ticket assignment changed',
                jsonb_build_object('old_assigned_to', OLD.assigned_to, 'new_assigned_to', NEW.assigned_to)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_support_categories_updated_at
    BEFORE UPDATE ON public.support_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_agents_updated_at
    BEFORE UPDATE ON public.support_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER log_ticket_activity
    AFTER UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.log_ticket_activity();

COMMIT; 