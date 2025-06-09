-- Add cities for Andaman and Nicobar Islands
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Nicobar'),
    ('North and Middle Andaman'),
    ('South Andaman')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'AN') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add city for Chandigarh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Chandigarh')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'CH') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Dadra and Nagar Haveli and Daman and Diu
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Dadra and Nagar Haveli'),
    ('Daman'),
    ('Diu')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'DH') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Delhi (NCT)
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

-- Add cities for Jammu and Kashmir
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Anantnag'),
    ('Bandipora'),
    ('Baramulla'),
    ('Budgam'),
    ('Doda'),
    ('Ganderbal'),
    ('Jammu'),
    ('Kathua'),
    ('Kishtwar'),
    ('Kulgam'),
    ('Kupwara'),
    ('Poonch'),
    ('Pulwama'),
    ('Rajouri'),
    ('Ramban'),
    ('Reasi'),
    ('Samba'),
    ('Shopian'),
    ('Srinagar'),
    ('Udhampur')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'JK') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Ladakh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Kargil'),
    ('Leh')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'LA') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add city for Lakshadweep
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Kavaratti')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'LD') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Puducherry
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Karaikal'),
    ('Mahe'),
    ('Puducherry'),
    ('Yanam')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'PY') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    -- Andaman and Nicobar Islands major city
    'Port Blair',
    
    -- Chandigarh (already a major city)
    'Chandigarh',
    
    -- Dadra and Nagar Haveli and Daman and Diu major cities
    'Silvassa',
    'Daman',
    'Diu',
    
    -- Delhi major areas
    'New Delhi',
    'Central Delhi',
    'South Delhi',
    'North Delhi',
    
    -- Jammu and Kashmir major cities
    'Srinagar',
    'Jammu',
    'Anantnag',
    'Baramulla',
    
    -- Ladakh major cities
    'Leh',
    'Kargil',
    
    -- Lakshadweep major city
    'Kavaratti',
    
    -- Puducherry major cities
    'Puducherry',
    'Karaikal'
); 