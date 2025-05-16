-- Create ticket activities table
BEGIN;

CREATE TABLE public.ticket_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL,
    user_id uuid,
    activity_type text NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_ticket_activities_ticket
        FOREIGN KEY (ticket_id) 
        REFERENCES public.support_tickets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ticket_activities_user
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    CONSTRAINT activity_type_check CHECK (activity_type IN (
        'status_change',
        'priority_change',
        'assignment_change',
        'category_change',
        'comment_added',
        'attachment_added'
    ))
);

-- Create index for ticket lookup
CREATE INDEX idx_ticket_activities_ticket_id ON public.ticket_activities(ticket_id);
CREATE INDEX idx_ticket_activities_user_id ON public.ticket_activities(user_id);

COMMIT; 