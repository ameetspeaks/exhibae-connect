-- First, create conversations from existing messages
INSERT INTO conversations (brand_id, organiser_id, exhibition_id, exhibition_name, created_at, updated_at)
SELECT DISTINCT
    CASE 
        WHEN sender_id = organiser_id THEN sender_id
        ELSE (SELECT id FROM auth.users WHERE id = sender_id)
    END as brand_id,
    organiser_id,
    exhibition_id,
    exhibition_name,
    MIN(created_at) as created_at,
    MAX(created_at) as updated_at
FROM organiser_messages
GROUP BY 
    CASE 
        WHEN sender_id = organiser_id THEN sender_id
        ELSE (SELECT id FROM auth.users WHERE id = sender_id)
    END,
    organiser_id,
    exhibition_id,
    exhibition_name
ON CONFLICT (brand_id, organiser_id, exhibition_id) DO NOTHING;

-- Then, update conversations with messages
WITH message_json AS (
    SELECT 
        CASE 
            WHEN sender_id = organiser_id THEN sender_id
            ELSE (SELECT id FROM auth.users WHERE id = sender_id)
        END as brand_id,
        organiser_id,
        exhibition_id,
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'sender_id', sender_id,
                'content', message,
                'created_at', created_at,
                'is_read', is_read,
                'read_at', read_at
            ) ORDER BY created_at ASC
        ) as messages,
        jsonb_build_object(
            'id', MAX(id),
            'sender_id', MAX(sender_id),
            'content', MAX(message),
            'created_at', MAX(created_at),
            'is_read', bool_and(is_read),
            'read_at', MAX(read_at)
        ) as last_message
    FROM organiser_messages
    GROUP BY 
        CASE 
            WHEN sender_id = organiser_id THEN sender_id
            ELSE (SELECT id FROM auth.users WHERE id = sender_id)
        END,
        organiser_id,
        exhibition_id
)
UPDATE conversations c
SET 
    messages = mj.messages,
    last_message = mj.last_message,
    updated_at = NOW()
FROM message_json mj
WHERE 
    c.brand_id = mj.brand_id 
    AND c.organiser_id = mj.organiser_id 
    AND COALESCE(c.exhibition_id, '') = COALESCE(mj.exhibition_id, ''); 