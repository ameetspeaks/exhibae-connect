-- Add cities for Rajasthan
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Ajmer'),
    ('Alwar'),
    ('Banswara'),
    ('Baran'),
    ('Barmer'),
    ('Bharatpur'),
    ('Bhilwara'),
    ('Bikaner'),
    ('Bundi'),
    ('Chittorgarh'),
    ('Churu'),
    ('Dausa'),
    ('Dholpur'),
    ('Dungarpur'),
    ('Ganganagar'),
    ('Hanumangarh'),
    ('Jaipur'),
    ('Jaisalmer'),
    ('Jalor'),
    ('Jhalawar'),
    ('Jhunjhunu'),
    ('Jodhpur'),
    ('Karauli'),
    ('Kota'),
    ('Nagaur'),
    ('Pali'),
    ('Pratapgarh'),
    ('Rajsamand'),
    ('Sawai Madhopur'),
    ('Sikar'),
    ('Sirohi'),
    ('Tonk'),
    ('Udaipur'),
    ('Shahpura'),
    ('Neem Ka Thana'),
    ('Beawar'),
    ('Balotra'),
    ('Didwana-Kuchaman'),
    ('Gangapur City'),
    ('Jaipur North'),
    ('Jaipur South'),
    ('Jodhpur East'),
    ('Jodhpur West'),
    ('Kotputli-Behror'),
    ('Khairthal-Tijara'),
    ('Phalodi'),
    ('Salumbar'),
    ('Sanchore'),
    ('Sujangarh'),
    ('Anupgarh')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'RJ') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Tamil Nadu
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Ariyalur'),
    ('Chengalpattu'),
    ('Chennai'),
    ('Coimbatore'),
    ('Cuddalore'),
    ('Dharmapuri'),
    ('Dindigul'),
    ('Erode'),
    ('Kallakurichi'),
    ('Kancheepuram'),
    ('Kanniyakumari'),
    ('Karur'),
    ('Krishnagiri'),
    ('Madurai'),
    ('Mayiladuthurai'),
    ('Nagapattinam'),
    ('Namakkal'),
    ('Nilgiris'),
    ('Perambalur'),
    ('Pudukkottai'),
    ('Ramanathapuram'),
    ('Ranipet'),
    ('Salem'),
    ('Sivaganga'),
    ('Tenkasi'),
    ('Thanjavur'),
    ('Theni'),
    ('Thoothukudi'),
    ('Tiruchirappalli'),
    ('Tirunelveli'),
    ('Tirupathur'),
    ('Tiruppur'),
    ('Tiruvallur'),
    ('Tiruvannamalai'),
    ('Tiruvarur'),
    ('Vellore'),
    ('Viluppuram'),
    ('Virudhunagar')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'TN') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    -- Rajasthan major cities
    'Jaipur',
    'Jodhpur',
    'Udaipur',
    'Kota',
    'Bikaner',
    'Ajmer',
    'Bhilwara',
    'Alwar',
    'Bharatpur',
    'Sikar',
    
    -- Tamil Nadu major cities
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tiruppur',
    'Erode',
    'Tirunelveli',
    'Thoothukudi',
    'Vellore',
    'Thanjavur'
); 