-- Insert test conversations
INSERT INTO conversations (
    brand_id,
    organiser_id,
    exhibition_id,
    exhibition_name,
    messages,
    last_message
)
SELECT 
    auth.uid(), -- Current user as brand
    (SELECT id FROM auth.users WHERE email = 'organiser@example.com' LIMIT 1), -- Test organiser
    (SELECT id FROM exhibitions LIMIT 1), -- First exhibition
    (SELECT title FROM exhibitions LIMIT 1),
    ARRAY[
        jsonb_build_object(
            'id', uuid_generate_v4(),
            'sender_id', auth.uid(),
            'content', 'Hello, I am interested in your exhibition',
            'created_at', now(),
            'is_read', false,
            'read_at', null
        )
    ]::jsonb[],
    jsonb_build_object(
        'id', uuid_generate_v4(),
        'sender_id', auth.uid(),
        'content', 'Hello, I am interested in your exhibition',
        'created_at', now(),
        'is_read', false,
        'read_at', null
    )
WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'organiser@example.com'
) AND EXISTS (
    SELECT 1 FROM exhibitions LIMIT 1
); 