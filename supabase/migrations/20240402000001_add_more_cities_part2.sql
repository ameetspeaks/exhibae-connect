-- Add cities for Bihar
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Araria'),
    ('Arwal'),
    ('Aurangabad'),
    ('Banka'),
    ('Begusarai'),
    ('Bhagalpur'),
    ('Bhojpur'),
    ('Buxar'),
    ('Darbhanga'),
    ('East Champaran'),
    ('Gaya'),
    ('Gopalganj'),
    ('Jamui'),
    ('Jehanabad'),
    ('Kaimur'),
    ('Katihar'),
    ('Khagaria'),
    ('Kishanganj'),
    ('Lakhisarai'),
    ('Madhepura'),
    ('Madhubani'),
    ('Munger'),
    ('Muzaffarpur'),
    ('Nalanda'),
    ('Nawada'),
    ('Patna'),
    ('Purnia'),
    ('Rohtas'),
    ('Saharsa'),
    ('Samastipur'),
    ('Saran'),
    ('Sheikhpura'),
    ('Sheohar'),
    ('Sitamarhi'),
    ('Siwan'),
    ('Supaul'),
    ('Vaishali'),
    ('West Champaran')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'BR') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Chhattisgarh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Balod'),
    ('Baloda Bazar'),
    ('Balrampur'),
    ('Bastar'),
    ('Bemetara'),
    ('Bijapur'),
    ('Bilaspur'),
    ('Dantewada'),
    ('Dhamtari'),
    ('Durg'),
    ('Gariaband'),
    ('Gaurela-Pendra-Marwahi'),
    ('Janjgir-Champa'),
    ('Jashpur'),
    ('Kabirdham'),
    ('Kanker'),
    ('Kondagaon'),
    ('Korba'),
    ('Koriya'),
    ('Mahasamund'),
    ('Mungeli'),
    ('Narayanpur'),
    ('Raigarh'),
    ('Raipur'),
    ('Rajnandgaon'),
    ('Sukma'),
    ('Surajpur'),
    ('Surguja')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'CG') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Delhi
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Central Delhi'),
    ('East Delhi'),
    ('New Delhi'),
    ('North Delhi'),
    ('North East Delhi'),
    ('North West Delhi'),
    ('Shahdara'),
    ('South Delhi'),
    ('South East Delhi'),
    ('South West Delhi'),
    ('West Delhi')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'DL') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    -- Bihar major cities
    'Patna',
    'Gaya',
    'Bhagalpur',
    'Muzaffarpur',
    'Purnia',
    'Darbhanga',
    
    -- Chhattisgarh major cities
    'Raipur',
    'Bilaspur',
    'Durg',
    'Rajnandgaon',
    'Korba',
    
    -- Delhi regions (all are major)
    'Central Delhi',
    'East Delhi',
    'New Delhi',
    'North Delhi',
    'North East Delhi',
    'North West Delhi',
    'Shahdara',
    'South Delhi',
    'South East Delhi',
    'South West Delhi',
    'West Delhi'
); 