-- Drop existing constraints and indexes if they exist
ALTER TABLE IF EXISTS organiser_messages
  DROP CONSTRAINT IF EXISTS organiser_messages_organiser_id_fkey,
  DROP CONSTRAINT IF EXISTS organiser_messages_sender_id_fkey,
  DROP CONSTRAINT IF EXISTS organiser_messages_exhibition_id_fkey;

DROP INDEX IF EXISTS idx_organiser_messages_organiser_id;
DROP INDEX IF EXISTS idx_organiser_messages_sender_id;
DROP INDEX IF EXISTS idx_organiser_messages_exhibition_id;
DROP INDEX IF EXISTS idx_organiser_messages_conversation_id;
DROP INDEX IF EXISTS idx_organiser_messages_created_at;

-- Create organiser_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS organiser_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organiser_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    exhibition_id UUID REFERENCES exhibitions(id) ON DELETE SET NULL,
    exhibition_name TEXT,
    conversation_id UUID
);

-- Add foreign key relationships to use profiles
ALTER TABLE organiser_messages
  ADD CONSTRAINT organiser_messages_organiser_id_fkey 
    FOREIGN KEY (organiser_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT organiser_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX idx_organiser_messages_organiser_id ON organiser_messages(organiser_id);
CREATE INDEX idx_organiser_messages_sender_id ON organiser_messages(sender_id);
CREATE INDEX idx_organiser_messages_exhibition_id ON organiser_messages(exhibition_id);
CREATE INDEX idx_organiser_messages_conversation_id ON organiser_messages(conversation_id);
CREATE INDEX idx_organiser_messages_created_at ON organiser_messages(created_at DESC);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON organiser_messages;
DROP POLICY IF EXISTS "Users can send messages" ON organiser_messages;

-- Enable RLS
ALTER TABLE organiser_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own messages"
  ON organiser_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE id = organiser_id OR id = sender_id
    )
  );

CREATE POLICY "Users can send messages"
  ON organiser_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE id = sender_id
    )
  );

-- Grant permissions
GRANT ALL ON organiser_messages TO authenticated; 