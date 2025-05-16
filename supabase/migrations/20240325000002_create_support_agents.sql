-- Create support agents table
BEGIN;

CREATE TABLE public.support_agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_support_agents_user
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create index for user lookup
CREATE INDEX idx_support_agents_user_id ON public.support_agents(user_id);

COMMIT; 