-- Disable triggers temporarily
SET session_replication_role = replica;

-- Insert exhibition categories if they don't exist
INSERT INTO exhibition_categories (id, name, description, created_at, updated_at)
VALUES 
    ('ff6d7196-8ff2-48a9-a062-ec5d56957377', 'Fashion', 'Fashion and apparel related exhibitions', NOW(), NOW()),
    ('ffc7d5c1-4530-4a40-bb18-40da3694be26', 'Technology', 'Technology and innovation exhibitions', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert venue types if they don't exist
INSERT INTO venue_types (id, name, description, created_at, updated_at)
VALUES 
    ('0c6f7566-439a-4379-85af-fa72ef438229', 'Indoor', 'Indoor venues for exhibitions', NOW(), NOW()),
    ('74ba9377-c128-487b-8569-88a28041e64e', 'Exhibition Hall', 'Purpose-built exhibition halls', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert measurement units if they don't exist
INSERT INTO measurement_units (id, name, symbol, type, created_at, updated_at)
VALUES 
    ('048a8af9-6ae0-486a-ac01-531f6f23fa05', 'Centimeter', 'cm', 'length', NOW(), NOW()),
    ('7697c7d7-6d1d-499c-ae7e-140ee9461da6', 'Square Meter', 'm²', 'area', NOW(), NOW())
ON CONFLICT (symbol) DO NOTHING;

-- Enable triggers again
SET session_replication_role = DEFAULT; 