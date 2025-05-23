-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    response TEXT,
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMPTZ
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for admins and managers to select messages
CREATE POLICY "Managers and Admins can view contact messages" 
    ON public.contact_messages
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'manager'::user_role OR role = 'admin'::user_role)
        )
    );

-- Create policy for admins and managers to update messages
CREATE POLICY "Managers and Admins can update contact messages" 
    ON public.contact_messages
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'manager'::user_role OR role = 'admin'::user_role)
        )
    );

-- Create policy for anyone to insert messages (including anonymous)
CREATE POLICY "Anyone can create contact messages" 
    ON public.contact_messages
    FOR INSERT 
    TO authenticated, anon
    WITH CHECK (true);

-- Create an index on created_at for better sorting performance
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at);

-- Create an index on status for filtering
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status); 