-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    user_id UUID REFERENCES auth.users(id),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Anyone can subscribe"
    ON subscriptions FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Users can unsubscribe themselves"
    ON subscriptions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can view all subscriptions"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Grant permissions
GRANT ALL ON subscriptions TO authenticated;
GRANT INSERT ON subscriptions TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 