-- Create RLS policies
BEGIN;

-- Enable RLS on all tables
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_categories
CREATE POLICY "Support categories are viewable by authenticated users"
    ON public.support_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Support categories are manageable by managers and admins"
    ON public.support_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
        )
    );

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets or assigned tickets"
    ON public.support_tickets FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
        )
    );

CREATE POLICY "Support staff can create tickets"
    ON public.support_tickets FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
        )
    );

CREATE POLICY "Support staff can update assigned tickets"
    ON public.support_tickets FOR UPDATE
    TO authenticated
    USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
        )
    );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their tickets"
    ON public.chat_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = ticket_id
            AND (
                t.user_id = auth.uid() OR
                t.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
                )
            )
        )
    );

CREATE POLICY "Users can send messages in their tickets"
    ON public.chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = ticket_id
            AND (
                t.user_id = auth.uid() OR
                t.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
                )
            )
        )
    );

-- RLS Policies for ticket_activities
CREATE POLICY "Users can view activities in their tickets"
    ON public.ticket_activities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = ticket_id
            AND (
                t.user_id = auth.uid() OR
                t.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
                )
            )
        )
    );

CREATE POLICY "Support staff can create activities"
    ON public.ticket_activities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
        )
    );

-- RLS Policies for support_agents
CREATE POLICY "Support agents are viewable by authenticated users"
    ON public.support_agents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Support agents can be managed by managers and admins"
    ON public.support_agents FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('manager', 'admin', 'superadmin')
        )
    );

COMMIT; 