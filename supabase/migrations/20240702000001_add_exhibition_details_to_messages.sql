-- Add exhibition details to organiser_messages table
ALTER TABLE organiser_messages
ADD COLUMN IF NOT EXISTS exhibition_id UUID REFERENCES exhibitions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS exhibition_name TEXT,
ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- Create index for exhibition lookup
CREATE INDEX IF NOT EXISTS idx_organiser_messages_exhibition_id ON organiser_messages(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_organiser_messages_conversation_id ON organiser_messages(conversation_id);

-- Update RLS policies to include exhibition access
CREATE POLICY "Users can view messages for exhibitions they're involved in"
    ON organiser_messages
    FOR SELECT
    TO authenticated
    USING (
        sender_id = auth.uid() OR
        organiser_id = auth.uid() OR
        exhibition_id IN (
            SELECT id FROM exhibitions
            WHERE organiser_id = auth.uid() OR
            id IN (SELECT exhibition_id FROM exhibition_applications WHERE brand_id = auth.uid())
        )
    ); 