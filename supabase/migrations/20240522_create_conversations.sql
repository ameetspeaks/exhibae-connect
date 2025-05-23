-- Create conversations table
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES auth.users(id) NOT NULL,
    organiser_id UUID REFERENCES auth.users(id) NOT NULL,
    exhibition_id UUID REFERENCES exhibitions(id),
    exhibition_name TEXT,
    last_message JSONB,
    messages JSONB[] DEFAULT ARRAY[]::JSONB[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    UNIQUE(brand_id, organiser_id, exhibition_id)
);

-- Add RLS policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = brand_id OR auth.uid() = organiser_id);

CREATE POLICY "Users can insert their own conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = brand_id OR auth.uid() = organiser_id);

CREATE POLICY "Users can update their own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = brand_id OR auth.uid() = organiser_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX idx_conversations_organiser_id ON conversations(organiser_id);
CREATE INDEX idx_conversations_exhibition_id ON conversations(exhibition_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Create function to add message to conversation
CREATE OR REPLACE FUNCTION add_message_to_conversation(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_message JSONB;
    v_conversation conversations;
BEGIN
    -- Create message JSON
    v_message = jsonb_build_object(
        'id', uuid_generate_v4(),
        'sender_id', p_sender_id,
        'content', p_content,
        'created_at', timezone('utc'::text, now()),
        'is_read', false,
        'read_at', null
    );

    -- Update conversation with new message
    UPDATE conversations
    SET 
        messages = array_append(messages, v_message),
        last_message = v_message,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_conversation_id
    RETURNING * INTO v_conversation;

    RETURN v_message;
END;
$$ LANGUAGE plpgsql; 