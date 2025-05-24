-- Add a more permissive policy for testing purposes
CREATE POLICY "Authenticated users can view contact messages" 
    ON public.contact_messages
    FOR SELECT 
    TO authenticated
    USING (true);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status); 