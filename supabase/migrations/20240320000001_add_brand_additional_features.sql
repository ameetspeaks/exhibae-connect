-- Create storage bucket for brand materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-materials', 'brand-materials', false);

-- Enable RLS on the bucket
CREATE POLICY "Brands can manage their own materials"
ON storage.objects
FOR ALL USING (
    bucket_id = 'brand-materials' AND 
    (auth.uid() = owner OR auth.uid() IN (
        SELECT user_id FROM brand_profiles WHERE id = SPLIT_PART(name, '/', 1)::uuid
    ))
);

-- Create brand_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS brand_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    logo_url TEXT,
    social_media JSONB DEFAULT '{}',
    materials JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on brand_profiles
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_profiles
CREATE POLICY "Brands can manage their own profile"
    ON brand_profiles FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Brand profiles are viewable by everyone"
    ON brand_profiles FOR SELECT
    USING (true);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exhibition_id, brand_id, organizer_id)
);

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    data JSONB NOT NULL,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_notification_type CHECK (
        type IN ('application_status', 'new_message', 'exhibition_update', 'marketing')
    )
);

-- Add RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (brand_id = auth.uid() OR organizer_id = auth.uid());

CREATE POLICY "Users can create conversations they're part of"
    ON conversations FOR INSERT
    WITH CHECK (brand_id = auth.uid() OR organizer_id = auth.uid());

-- Email notifications policies
CREATE POLICY "Users can view their own notifications"
    ON email_notifications FOR SELECT
    USING (user_id = auth.uid());

-- Add trigger for conversation last_message_at update
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Add indexes for better performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_conversations_participants ON conversations(brand_id, organizer_id);
CREATE INDEX idx_email_notifications_user ON email_notifications(user_id, type);
CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Add brand_materials column to brand_profiles
ALTER TABLE brand_profiles
ADD COLUMN materials JSONB DEFAULT '[]'; 