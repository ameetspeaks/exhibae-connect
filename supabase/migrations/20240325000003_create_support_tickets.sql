-- Create support tickets table
BEGIN;

-- Drop existing table if exists
DROP TABLE IF EXISTS public.support_tickets CASCADE;

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number text UNIQUE NOT NULL DEFAULT 'TKT-' || floor(random() * 1000000)::text,
    category_id uuid,
    created_by uuid,
    user_id uuid,
    user_role text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    priority text NOT NULL DEFAULT 'medium',
    subject text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    closed_at timestamptz,
    CONSTRAINT status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT fk_support_tickets_category
        FOREIGN KEY (category_id) 
        REFERENCES public.support_categories(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_support_tickets_created_by
        FOREIGN KEY (created_by) 
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_support_tickets_user
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Add assigned_to column separately to ensure it exists
ALTER TABLE public.support_tickets 
ADD COLUMN assigned_to uuid,
ADD CONSTRAINT fk_support_tickets_assigned_to
    FOREIGN KEY (assigned_to) 
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- Create indexes for common lookups
CREATE INDEX idx_support_tickets_category_id ON public.support_tickets(category_id);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);

COMMIT; 