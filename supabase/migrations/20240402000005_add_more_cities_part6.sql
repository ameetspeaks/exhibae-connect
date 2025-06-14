-- Add cities for Telangana
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Adilabad'),
    ('Bhadradri Kothagudem'),
    ('Hanumakonda'),
    ('Hyderabad'),
    ('Jagtial'),
    ('Jangaon'),
    ('Jayashankar Bhupalpally'),
    ('Jogulamba Gadwal'),
    ('Kamareddy'),
    ('Karimnagar'),
    ('Khammam'),
    ('Komaram Bheem'),
    ('Mahabubabad'),
    ('Mahabubnagar'),
    ('Mancherial'),
    ('Medak'),
    ('Medchal–Malkajgiri'),
    ('Mulugu'),
    ('Nagarkurnool'),
    ('Nalgonda'),
    ('Narayanpet'),
    ('Nirmal'),
    ('Nizamabad'),
    ('Peddapalli'),
    ('Rajanna Sircilla'),
    ('Ranga Reddy'),
    ('Sangareddy'),
    ('Siddipet'),
    ('Suryapet'),
    ('Vikarabad'),
    ('Wanaparthy'),
    ('Warangal'),
    ('Yadadri Bhuvanagiri')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'TS') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Add cities for Uttar Pradesh
INSERT INTO public.cities (name, state_id, is_major)
SELECT d.city_name, s.id, false
FROM (VALUES
    ('Agra'),
    ('Aligarh'),
    ('Prayagraj'),
    ('Ambedkar Nagar'),
    ('Amethi'),
    ('Amroha'),
    ('Auraiya'),
    ('Ayodhya'),
    ('Azamgarh'),
    ('Baghpat'),
    ('Bahraich'),
    ('Ballia'),
    ('Balrampur'),
    ('Banda'),
    ('Barabanki'),
    ('Bareilly'),
    ('Basti'),
    ('Bhadohi'),
    ('Bijnor'),
    ('Budaun'),
    ('Bulandshahr'),
    ('Chandauli'),
    ('Chitrakoot'),
    ('Deoria'),
    ('Etah'),
    ('Etawah'),
    ('Farrukhabad'),
    ('Fatehpur'),
    ('Firozabad'),
    ('Gautam Buddha Nagar'),
    ('Ghaziabad'),
    ('Ghazipur'),
    ('Gonda'),
    ('Gorakhpur'),
    ('Hamirpur'),
    ('Hapur'),
    ('Hardoi'),
    ('Hathras'),
    ('Jalaun'),
    ('Jaunpur'),
    ('Jhansi'),
    ('Kannauj'),
    ('Kanpur Dehat'),
    ('Kanpur Nagar'),
    ('Kasganj'),
    ('Kaushambi'),
    ('Kushinagar'),
    ('Lakhimpur Kheri'),
    ('Lalitpur'),
    ('Lucknow'),
    ('Maharajganj'),
    ('Mahoba'),
    ('Mainpuri'),
    ('Mathura'),
    ('Mau'),
    ('Meerut'),
    ('Mirzapur'),
    ('Moradabad'),
    ('Muzaffarnagar'),
    ('Pilibhit'),
    ('Pratapgarh'),
    ('Rae Bareli'),
    ('Rampur'),
    ('Saharanpur'),
    ('Sambhal'),
    ('Sant Kabir Nagar'),
    ('Shahjahanpur'),
    ('Shamli'),
    ('Shravasti'),
    ('Siddharthnagar'),
    ('Sitapur'),
    ('Sonbhadra'),
    ('Sultanpur'),
    ('Unnao'),
    ('Varanasi')
) AS d(city_name)
CROSS JOIN (SELECT id FROM states WHERE state_code = 'UP') AS s
ON CONFLICT (name, state_id) DO NOTHING;

-- Update major cities
UPDATE public.cities
SET is_major = true
WHERE name IN (
    -- Telangana major cities
    'Hyderabad',
    'Warangal',
    'Nizamabad',
    'Karimnagar',
    'Khammam',
    'Ramagundam',
    'Mahbubnagar',
    'Nalgonda',
    'Adilabad',
    'Suryapet',
    
    -- Uttar Pradesh major cities
    'Lucknow',
    'Kanpur Nagar',
    'Ghaziabad',
    'Agra',
    'Meerut',
    'Varanasi',
    'Prayagraj',
    'Bareilly',
    'Aligarh',
    'Moradabad',
    'Saharanpur',
    'Gorakhpur',
    'Noida',
    'Firozabad',
    'Jhansi'
); 