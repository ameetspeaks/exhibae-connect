-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 