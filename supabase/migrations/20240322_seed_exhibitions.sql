-- Disable triggers temporarily
SET session_replication_role = replica;

-- Insert two exhibitions for the specified organiser
INSERT INTO exhibitions (
    id,
    title,
    description,
    start_date,
    end_date,
    address,
    city,
    state,
    country,
    postal_code,
    category_id,
    venue_type_id,
    organiser_id,
    status,
    created_at,
    updated_at
) VALUES 
(
    'e5c6a2d8-1234-4567-8901-abcdef123456',
    'Fashion Forward 2024',
    'Experience the future of fashion at our premier exhibition showcasing emerging designers and sustainable fashion innovations. Network with industry leaders and discover the latest trends.',
    '2024-05-15 09:00:00+00',
    '2024-05-17 18:00:00+00',
    '123 Fashion Avenue',
    'Mumbai',
    'Maharashtra',
    'India',
    '400001',
    'ff6d7196-8ff2-48a9-a062-ec5d56957377', -- Fashion category
    '74ba9377-c128-487b-8569-88a28041e64e', -- Exhibition Hall
    'abfc8e4b-e453-467d-94e2-511dba6135da',
    'published',
    NOW(),
    NOW()
),
(
    'f7d8b3e9-9876-5432-1098-fedcba987654',
    'Tech Innovate Expo 2024',
    'Discover groundbreaking technologies and innovative solutions at our comprehensive tech exhibition. Connect with tech leaders and experience hands-on demonstrations.',
    '2024-06-20 10:00:00+00',
    '2024-06-22 17:00:00+00',
    '456 Tech Park Road',
    'Bangalore',
    'Karnataka',
    'India',
    '560001',
    'ffc7d5c1-4530-4a40-bb18-40da3694be26', -- Technology category
    '0c6f7566-439a-4379-85af-fa72ef438229', -- Indoor venue
    'abfc8e4b-e453-467d-94e2-511dba6135da',
    'published',
    NOW(),
    NOW()
);

-- Add some stalls for Fashion Forward 2024
INSERT INTO stalls (
    id,
    exhibition_id,
    name,
    description,
    length,
    width,
    price,
    quantity,
    measuring_unit_id,
    created_at,
    updated_at
) VALUES 
(
    'a1b2c3d4-1111-2222-3333-444455556666',
    'e5c6a2d8-1234-4567-8901-abcdef123456',
    'Premium Corner Booth',
    'Large corner booth with premium visibility and extra space',
    600,
    400,
    25000,
    4,
    '048a8af9-6ae0-486a-ac01-531f6f23fa05', -- Centimeter
    NOW(),
    NOW()
),
(
    'b2c3d4e5-2222-3333-4444-555566667777',
    'e5c6a2d8-1234-4567-8901-abcdef123456',
    'Standard Booth',
    'Standard-sized booth perfect for brand displays',
    300,
    300,
    15000,
    8,
    '048a8af9-6ae0-486a-ac01-531f6f23fa05', -- Centimeter
    NOW(),
    NOW()
);

-- Add stalls for Tech Innovate Expo
INSERT INTO stalls (
    id,
    exhibition_id,
    name,
    description,
    length,
    width,
    price,
    quantity,
    measuring_unit_id,
    created_at,
    updated_at
) VALUES 
(
    'c3d4e5f6-3333-4444-5555-666677778888',
    'f7d8b3e9-9876-5432-1098-fedcba987654',
    'Tech Demo Zone',
    'Large space for interactive tech demonstrations',
    800,
    600,
    35000,
    3,
    '048a8af9-6ae0-486a-ac01-531f6f23fa05', -- Centimeter
    NOW(),
    NOW()
),
(
    'd4e5f6g7-4444-5555-6666-777788889999',
    'f7d8b3e9-9876-5432-1098-fedcba987654',
    'Startup Pod',
    'Compact space perfect for startups and small companies',
    200,
    200,
    10000,
    12,
    '048a8af9-6ae0-486a-ac01-531f6f23fa05', -- Centimeter
    NOW(),
    NOW()
);

-- Enable triggers again
SET session_replication_role = DEFAULT; 