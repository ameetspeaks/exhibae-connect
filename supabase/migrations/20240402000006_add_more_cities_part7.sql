-- Add cities for Uttarakhand
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Almora'),
    ('Bageshwar'),
    ('Chamoli'),
    ('Champawat'),
    ('Dehradun'),
    ('Haridwar'),
    ('Nainital'),
    ('Pauri Garhwal'),
    ('Pithoragarh'),
    ('Rudraprayag'),
    ('Tehri Garhwal'),
    ('Udham Singh Nagar'),
    ('Uttarkashi')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'UK') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for West Bengal
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Alipurduar'),
    ('Bankura'),
    ('Birbhum'),
    ('Cooch Behar'),
    ('Dakshin Dinajpur'),
    ('Darjeeling'),
    ('Hooghly'),
    ('Howrah'),
    ('Jalpaiguri'),
    ('Jhargram'),
    ('Kalimpong'),
    ('Kolkata'),
    ('Malda'),
    ('Murshidabad'),
    ('Nadia'),
    ('North 24 Parganas'),
    ('Paschim Bardhaman'),
    ('Paschim Medinipur'),
    ('Purba Bardhaman'),
    ('Purba Medinipur'),
    ('Purulia'),
    ('South 24 Parganas'),
    ('Uttar Dinajpur')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'WB') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    -- Uttarakhand major cities
    'Dehradun',
    'Haridwar',
    'Nainital',
    'Rishikesh',
    'Haldwani',
    'Roorkee',
    'Kashipur',
    'Rudrapur',
    
    -- West Bengal major cities
    'Kolkata',
    'Howrah',
    'Durgapur',
    'Asansol',
    'Siliguri',
    'Darjeeling',
    'Kharagpur',
    'Haldia',
    'Malda',
    'Baharampur',
    'Krishnanagar'
); 