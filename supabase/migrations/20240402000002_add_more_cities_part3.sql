-- Add cities for Goa
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('North Goa'),
    ('South Goa')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'GA') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Gujarat
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Ahmedabad'),
    ('Amreli'),
    ('Anand'),
    ('Aravalli'),
    ('Banaskantha'),
    ('Bharuch'),
    ('Bhavnagar'),
    ('Botad'),
    ('Chhota Udaipur'),
    ('Dahod'),
    ('Dang'),
    ('Devbhumi Dwarka'),
    ('Gandhinagar'),
    ('Gir Somnath'),
    ('Jamnagar'),
    ('Junagadh'),
    ('Kheda'),
    ('Kutch'),
    ('Mahisagar'),
    ('Mehsana'),
    ('Morbi'),
    ('Narmada'),
    ('Navsari'),
    ('Panchmahal'),
    ('Patan'),
    ('Porbandar'),
    ('Rajkot'),
    ('Sabarkantha'),
    ('Surat'),
    ('Surendranagar'),
    ('Tapi'),
    ('Vadodara'),
    ('Valsad')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'GJ') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Haryana
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Ambala'),
    ('Bhiwani'),
    ('Charkhi Dadri'),
    ('Faridabad'),
    ('Fatehabad'),
    ('Gurugram'),
    ('Hisar'),
    ('Jhajjar'),
    ('Jind'),
    ('Kaithal'),
    ('Karnal'),
    ('Kurukshetra'),
    ('Mahendragarh'),
    ('Nuh'),
    ('Palwal'),
    ('Panchkula'),
    ('Panipat'),
    ('Rewari'),
    ('Rohtak'),
    ('Sirsa'),
    ('Sonipat'),
    ('Yamunanagar')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'HR') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Himachal Pradesh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Bilaspur'),
    ('Chamba'),
    ('Hamirpur'),
    ('Kangra'),
    ('Kinnaur'),
    ('Kullu'),
    ('Lahaul and Spiti'),
    ('Mandi'),
    ('Shimla'),
    ('Sirmaur'),
    ('Solan'),
    ('Una')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'HP') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Jharkhand
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Bokaro'),
    ('Chatra'),
    ('Deoghar'),
    ('Dhanbad'),
    ('Dumka'),
    ('East Singhbhum'),
    ('Garhwa'),
    ('Giridih'),
    ('Godda'),
    ('Gumla'),
    ('Hazaribagh'),
    ('Jamtara'),
    ('Khunti'),
    ('Koderma'),
    ('Latehar'),
    ('Lohardaga'),
    ('Pakur'),
    ('Palamu'),
    ('Ramgarh'),
    ('Ranchi'),
    ('Sahibganj'),
    ('Seraikela Kharsawan'),
    ('Simdega'),
    ('West Singhbhum')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'JH') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Karnataka
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Bagalkot'),
    ('Ballari'),
    ('Belagavi'),
    ('Bengaluru Rural'),
    ('Bengaluru Urban'),
    ('Bidar'),
    ('Chamarajanagar'),
    ('Chikkaballapur'),
    ('Chikkamagaluru'),
    ('Chitradurga'),
    ('Dakshina Kannada'),
    ('Davanagere'),
    ('Dharwad'),
    ('Gadag'),
    ('Hassan'),
    ('Haveri'),
    ('Kalaburagi'),
    ('Kodagu'),
    ('Kolar'),
    ('Koppal'),
    ('Mandya'),
    ('Mysuru'),
    ('Raichur'),
    ('Ramanagara'),
    ('Shivamogga'),
    ('Tumakuru'),
    ('Udupi'),
    ('Uttara Kannada'),
    ('Vijayapura'),
    ('Yadgir')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'KA') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Kerala
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Alappuzha'),
    ('Ernakulam'),
    ('Idukki'),
    ('Kannur'),
    ('Kasaragod'),
    ('Kollam'),
    ('Kottayam'),
    ('Kozhikode'),
    ('Malappuram'),
    ('Palakkad'),
    ('Pathanamthitta'),
    ('Thiruvananthapuram'),
    ('Thrissur'),
    ('Wayanad')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'KL') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    -- Goa major cities
    'Panaji',
    'Margao',
    'Vasco da Gama',
    
    -- Gujarat major cities
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Gandhinagar',
    'Bhavnagar',
    'Jamnagar',
    
    -- Haryana major cities
    'Gurugram',
    'Faridabad',
    'Panipat',
    'Ambala',
    'Karnal',
    'Hisar',
    
    -- Himachal Pradesh major cities
    'Shimla',
    'Mandi',
    'Dharamshala',
    'Solan',
    'Kullu',
    
    -- Jharkhand major cities
    'Ranchi',
    'Jamshedpur',
    'Dhanbad',
    'Bokaro Steel City',
    'Hazaribagh',
    
    -- Karnataka major cities
    'Bengaluru Urban',
    'Mysuru',
    'Hubballi-Dharwad',
    'Belagavi',
    'Mangaluru',
    'Kalaburagi',
    
    -- Kerala major cities
    'Thiruvananthapuram',
    'Kochi',
    'Kozhikode',
    'Thrissur',
    'Kollam',
    'Alappuzha'
); 