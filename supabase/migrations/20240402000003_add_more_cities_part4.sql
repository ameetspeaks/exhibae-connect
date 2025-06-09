-- Add cities for Madhya Pradesh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Agar Malwa'),
    ('Alirajpur'),
    ('Anuppur'),
    ('Ashoknagar'),
    ('Balaghat'),
    ('Barwani'),
    ('Betul'),
    ('Bhind'),
    ('Bhopal'),
    ('Burhanpur'),
    ('Chhatarpur'),
    ('Chhindwara'),
    ('Damoh'),
    ('Datia'),
    ('Dewas'),
    ('Dhar'),
    ('Dindori'),
    ('Guna'),
    ('Gwalior'),
    ('Harda'),
    ('Hoshangabad'),
    ('Indore'),
    ('Jabalpur'),
    ('Jhabua'),
    ('Katni'),
    ('Khandwa'),
    ('Khargone'),
    ('Mandla'),
    ('Mandsaur'),
    ('Morena'),
    ('Narsinghpur'),
    ('Neemuch'),
    ('Niwari'),
    ('Panna'),
    ('Raisen'),
    ('Rajgarh'),
    ('Ratlam'),
    ('Rewa'),
    ('Sagar'),
    ('Satna'),
    ('Sehore'),
    ('Seoni'),
    ('Shahdol'),
    ('Shajapur'),
    ('Sheopur'),
    ('Shivpuri'),
    ('Sidhi'),
    ('Singrauli'),
    ('Tikamgarh'),
    ('Ujjain'),
    ('Umaria'),
    ('Vidisha')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'MP') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Maharashtra
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Ahmednagar'),
    ('Akola'),
    ('Amravati'),
    ('Aurangabad'),
    ('Beed'),
    ('Bhandara'),
    ('Buldhana'),
    ('Chandrapur'),
    ('Dhule'),
    ('Gadchiroli'),
    ('Gondia'),
    ('Hingoli'),
    ('Jalgaon'),
    ('Jalna'),
    ('Kolhapur'),
    ('Latur'),
    ('Mumbai City'),
    ('Mumbai Suburban'),
    ('Nagpur'),
    ('Nanded'),
    ('Nandurbar'),
    ('Nashik'),
    ('Osmanabad'),
    ('Palghar'),
    ('Parbhani'),
    ('Pune'),
    ('Raigad'),
    ('Ratnagiri'),
    ('Sangli'),
    ('Satara'),
    ('Sindhudurg'),
    ('Solapur'),
    ('Thane'),
    ('Wardha'),
    ('Washim'),
    ('Yavatmal')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'MH') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    -- Madhya Pradesh major cities
    'Bhopal',
    'Indore',
    'Jabalpur',
    'Gwalior',
    'Ujjain',
    'Satna',
    'Sagar',
    'Rewa',
    
    -- Maharashtra major cities
    'Mumbai City',
    'Mumbai Suburban',
    'Pune',
    'Nagpur',
    'Thane',
    'Nashik',
    'Aurangabad',
    'Solapur',
    'Amravati',
    'Kolhapur',
    'Navi Mumbai',
    'Sangli'
); 