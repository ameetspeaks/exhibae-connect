-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create organiser_followers table
CREATE TABLE IF NOT EXISTS organiser_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organiser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organiser_id, follower_id)
);

-- Create index for organiser_followers
CREATE INDEX IF NOT EXISTS idx_organiser_followers_organiser_id ON organiser_followers(organiser_id);
CREATE INDEX IF NOT EXISTS idx_organiser_followers_follower_id ON organiser_followers(follower_id);

-- Create organiser_messages table
CREATE TABLE IF NOT EXISTS organiser_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organiser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL
);

-- Create index for organiser_messages
CREATE INDEX IF NOT EXISTS idx_organiser_messages_organiser_id ON organiser_messages(organiser_id);
CREATE INDEX IF NOT EXISTS idx_organiser_messages_sender_id ON organiser_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_organiser_messages_is_read ON organiser_messages(is_read);

-- Add RLS policies
ALTER TABLE organiser_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organiser_messages ENABLE ROW LEVEL SECURITY;

-- Followers policies
CREATE POLICY "Any user can follow organisers"
    ON organiser_followers
    FOR INSERT
    TO authenticated
    WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow organisers"
    ON organiser_followers
    FOR DELETE
    TO authenticated
    USING (follower_id = auth.uid());

CREATE POLICY "Users can see who they follow"
    ON organiser_followers
    FOR SELECT
    TO authenticated
    USING (follower_id = auth.uid() OR organiser_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can send messages to organisers"
    ON organiser_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Organisers can see messages sent to them"
    ON organiser_messages
    FOR SELECT
    TO authenticated
    USING (organiser_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Organisers can mark messages as read"
    ON organiser_messages
    FOR UPDATE
    TO authenticated
    USING (organiser_id = auth.uid())
    WITH CHECK (organiser_id = auth.uid());

-- Create trigger to update organiser followers count
CREATE OR REPLACE FUNCTION update_organiser_followers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET followers_count = followers_count + 1
        WHERE id = NEW.organiser_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET followers_count = GREATEST(0, followers_count - 1)
        WHERE id = OLD.organiser_id;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for followers count
CREATE TRIGGER update_followers_count
    AFTER INSERT OR DELETE ON organiser_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_organiser_followers_count();

-- Enable triggers again
SET session_replication_role = DEFAULT; 