-- Create base tables (no dependencies)
BEGIN;

-- Create support categories table
CREATE TABLE public.support_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert default support categories
INSERT INTO public.support_categories (name, description) VALUES
    ('Technical Issue', 'Technical problems with the platform'),
    ('Billing', 'Payment and billing related queries'),
    ('Exhibition Setup', 'Help with setting up exhibitions'),
    ('Account Access', 'Login and account access issues'),
    ('General Inquiry', 'General questions and information');

COMMIT; 