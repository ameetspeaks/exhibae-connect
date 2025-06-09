-- Add cities for Andhra Pradesh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Anantapur'),
    ('Chittoor'),
    ('East Godavari'),
    ('Guntur'),
    ('Krishna'),
    ('Kurnool'),
    ('Nellore'),
    ('Prakasam'),
    ('Srikakulam'),
    ('Visakhapatnam'),
    ('Vizianagaram'),
    ('West Godavari'),
    ('YSR Kadapa')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'AP') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Arunachal Pradesh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Tawang'),
    ('West Kameng'),
    ('East Kameng'),
    ('Papum Pare'),
    ('Kurung Kumey'),
    ('Kra Daadi'),
    ('Lower Subansiri'),
    ('Upper Subansiri'),
    ('West Siang'),
    ('East Siang'),
    ('Siang'),
    ('Upper Siang'),
    ('Lower Siang'),
    ('Dibang Valley'),
    ('Lower Dibang Valley'),
    ('Lohit'),
    ('Anjaw'),
    ('Changlang'),
    ('Tirap'),
    ('Longding')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'AR') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Assam
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Baksa'),
    ('Barpeta'),
    ('Biswanath'),
    ('Bongaigaon'),
    ('Cachar'),
    ('Charaideo'),
    ('Chirang'),
    ('Darrang'),
    ('Dhemaji'),
    ('Dhubri'),
    ('Dibrugarh'),
    ('Goalpara'),
    ('Golaghat'),
    ('Hailakandi'),
    ('Hojai'),
    ('Jorhat'),
    ('Kamrup'),
    ('Kamrup Metropolitan'),
    ('Karbi Anglong'),
    ('Karimganj'),
    ('Kokrajhar'),
    ('Lakhimpur'),
    ('Majuli'),
    ('Morigaon'),
    ('Nagaon'),
    ('Nalbari'),
    ('Sivasagar'),
    ('Sonitpur'),
    ('South Salmara-Mankachar'),
    ('Tinsukia'),
    ('Udalguri'),
    ('West Karbi Anglong')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'AS') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    'Visakhapatnam',
    'Guntur',
    'Vijayawada',
    'Nellore',
    'Kurnool',
    'Itanagar',
    'Naharlagun',
    'Guwahati',
    'Silchar',
    'Dibrugarh',
    'Jorhat',
    'Nagaon'
); 