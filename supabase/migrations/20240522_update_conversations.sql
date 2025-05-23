-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS conversations
  DROP CONSTRAINT IF EXISTS conversations_brand_id_fkey,
  DROP CONSTRAINT IF EXISTS conversations_organiser_id_fkey;

-- Update the foreign key relationships to use the profiles table
ALTER TABLE conversations
  ADD CONSTRAINT conversations_brand_id_fkey 
    FOREIGN KEY (brand_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT conversations_organiser_id_fkey 
    FOREIGN KEY (organiser_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Add indexes for the foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_brand_id 
  ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organiser_id 
  ON conversations(organiser_id);

-- Add function to handle message reactions
CREATE OR REPLACE FUNCTION add_message_reaction(
  p_conversation_id UUID,
  p_message_id UUID,
  p_user_id UUID,
  p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_message JSONB;
  v_reaction JSONB;
BEGIN
  -- Create the reaction object
  v_reaction = jsonb_build_object(
    'type', p_reaction_type,
    'user_id', p_user_id,
    'created_at', now()
  );

  -- Update the message with the new reaction
  UPDATE conversations
  SET messages = jsonb_set(
    messages,
    ARRAY[array_position(messages->>'id', p_message_id)::text, 'reactions'],
    COALESCE(
      messages->array_position(messages->>'id', p_message_id)::text->'reactions' || v_reaction,
      jsonb_build_array(v_reaction)
    )
  )
  WHERE id = p_conversation_id
  RETURNING messages->array_position(messages->>'id', p_message_id)::text AS message
  INTO v_message;

  RETURN v_message;
END;
$$;

-- Add function to remove message reactions
CREATE OR REPLACE FUNCTION remove_message_reaction(
  p_conversation_id UUID,
  p_message_id UUID,
  p_user_id UUID,
  p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_message JSONB;
BEGIN
  -- Remove the reaction from the message
  UPDATE conversations
  SET messages = jsonb_set(
    messages,
    ARRAY[array_position(messages->>'id', p_message_id)::text, 'reactions'],
    (
      SELECT jsonb_agg(reaction)
      FROM jsonb_array_elements(messages->array_position(messages->>'id', p_message_id)::text->'reactions') reaction
      WHERE NOT (
        reaction->>'user_id' = p_user_id::text 
        AND reaction->>'type' = p_reaction_type
      )
    )
  )
  WHERE id = p_conversation_id
  RETURNING messages->array_position(messages->>'id', p_message_id)::text AS message
  INTO v_message;

  RETURN v_message;
END;
$$;

-- Add function to update message status
CREATE OR REPLACE FUNCTION update_message_status(
  p_conversation_id UUID,
  p_message_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_message JSONB;
BEGIN
  UPDATE conversations
  SET messages = jsonb_set(
    messages,
    ARRAY[array_position(messages->>'id', p_message_id)::text, 'status'],
    to_jsonb(p_status)
  )
  WHERE id = p_conversation_id
  RETURNING messages->array_position(messages->>'id', p_message_id)::text AS message
  INTO v_message;

  RETURN v_message;
END;
$$; 