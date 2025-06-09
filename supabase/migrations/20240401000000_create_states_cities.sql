-- Create states table
CREATE TABLE IF NOT EXISTS public.states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL UNIQUE,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cities table with foreign key to states
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    is_major BOOLEAN DEFAULT false,
    population INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, state_id)
);

-- Create indexes
CREATE INDEX idx_cities_state_id ON public.cities(state_id);
CREATE INDEX idx_cities_is_major ON public.cities(is_major);
CREATE INDEX idx_states_state_code ON public.states(state_code);

-- Enable Row Level Security (RLS)
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to states"
ON public.states FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access to cities"
ON public.cities FOR SELECT
TO public
USING (true);

-- Insert states data
INSERT INTO public.states (name, state_code, latitude, longitude) VALUES
('Andhra Pradesh', 'AP', 15.9129, 79.7400),
('Arunachal Pradesh', 'AR', 28.2180, 94.7278),
('Assam', 'AS', 26.2006, 92.9376),
('Bihar', 'BR', 25.0961, 85.3131),
('Chhattisgarh', 'CG', 21.2787, 81.8661),
('Delhi', 'DL', 28.7041, 77.1025),
('Goa', 'GA', 15.2993, 74.1240),
('Gujarat', 'GJ', 22.2587, 71.1924),
('Haryana', 'HR', 29.0588, 76.0856),
('Himachal Pradesh', 'HP', 31.1048, 77.1734),
('Jharkhand', 'JH', 23.6102, 85.2799),
('Karnataka', 'KA', 15.3173, 75.7139),
('Kerala', 'KL', 10.8505, 76.2711),
('Madhya Pradesh', 'MP', 22.9734, 78.6569),
('Maharashtra', 'MH', 19.7515, 75.7139),
('Manipur', 'MN', 24.6637, 93.9063),
('Meghalaya', 'ML', 25.4670, 91.3662),
('Mizoram', 'MZ', 23.1645, 92.9376),
('Nagaland', 'NL', 26.1584, 94.5624),
('Odisha', 'OR', 20.9517, 85.0985),
('Punjab', 'PB', 31.1471, 75.3412),
('Rajasthan', 'RJ', 27.0238, 74.2179),
('Sikkim', 'SK', 27.5330, 88.5122),
('Tamil Nadu', 'TN', 11.1271, 78.6569),
('Telangana', 'TG', 18.1124, 79.0193),
('Tripura', 'TR', 23.9408, 91.9882),
('Uttar Pradesh', 'UP', 26.8467, 80.9462),
('Uttarakhand', 'UK', 30.0668, 79.0193),
('West Bengal', 'WB', 22.9868, 87.8550);

-- Insert major cities data (sample for key states)
-- Maharashtra
INSERT INTO public.cities (name, state_id, latitude, longitude, is_major, population) VALUES
('Mumbai', (SELECT id FROM states WHERE state_code = 'MH'), 19.0760, 72.8777, true, 20185064),
('Pune', (SELECT id FROM states WHERE state_code = 'MH'), 18.5204, 73.8567, true, 6629276),
('Nagpur', (SELECT id FROM states WHERE state_code = 'MH'), 21.1458, 79.0882, true, 2893577),
('Thane', (SELECT id FROM states WHERE state_code = 'MH'), 19.2183, 72.9781, true, 2486941),
('Nashik', (SELECT id FROM states WHERE state_code = 'MH'), 20.0059, 73.7897, true, 1486053),
('Aurangabad', (SELECT id FROM states WHERE state_code = 'MH'), 19.8762, 75.3433, true, 1371330),
('Solapur', (SELECT id FROM states WHERE state_code = 'MH'), 17.6599, 75.9064, true, 951558),
('Kolhapur', (SELECT id FROM states WHERE state_code = 'MH'), 16.7050, 74.2433, true, 549283);

-- Delhi
INSERT INTO public.cities (name, state_id, latitude, longitude, is_major, population) VALUES
('New Delhi', (SELECT id FROM states WHERE state_code = 'DL'), 28.6139, 77.2090, true, 16787941),
('Delhi', (SELECT id FROM states WHERE state_code = 'DL'), 28.7041, 77.1025, true, 16787941);

-- Karnataka
INSERT INTO public.cities (name, state_id, latitude, longitude, is_major, population) VALUES
('Bengaluru', (SELECT id FROM states WHERE state_code = 'KA'), 12.9716, 77.5946, true, 12425304),
('Mysuru', (SELECT id FROM states WHERE state_code = 'KA'), 12.2958, 76.6394, true, 1014227),
('Hubli-Dharwad', (SELECT id FROM states WHERE state_code = 'KA'), 15.3647, 75.1240, true, 943857),
('Mangaluru', (SELECT id FROM states WHERE state_code = 'KA'), 12.9141, 74.8560, true, 623841),
('Belagavi', (SELECT id FROM states WHERE state_code = 'KA'), 15.8497, 74.4977, true, 610189);

-- Tamil Nadu
INSERT INTO public.cities (name, state_id, latitude, longitude, is_major, population) VALUES
('Chennai', (SELECT id FROM states WHERE state_code = 'TN'), 13.0827, 80.2707, true, 10971108),
('Coimbatore', (SELECT id FROM states WHERE state_code = 'TN'), 11.0168, 76.9558, true, 2151466),
('Madurai', (SELECT id FROM states WHERE state_code = 'TN'), 9.9252, 78.1198, true, 1561129),
('Tiruchirappalli', (SELECT id FROM states WHERE state_code = 'TN'), 10.7905, 78.7047, true, 916857),
('Salem', (SELECT id FROM states WHERE state_code = 'TN'), 11.6643, 78.1460, true, 831038);

-- Uttar Pradesh
INSERT INTO public.cities (name, state_id, latitude, longitude, is_major, population) VALUES
('Lucknow', (SELECT id FROM states WHERE state_code = 'UP'), 26.8467, 80.9462, true, 3382000),
('Kanpur', (SELECT id FROM states WHERE state_code = 'UP'), 26.4499, 80.3319, true, 2768057),
('Ghaziabad', (SELECT id FROM states WHERE state_code = 'UP'), 28.6692, 77.4538, true, 2381452),
('Agra', (SELECT id FROM states WHERE state_code = 'UP'), 27.1767, 78.0081, true, 1746467),
('Varanasi', (SELECT id FROM states WHERE state_code = 'UP'), 25.3176, 82.9739, true, 1435113),
('Meerut', (SELECT id FROM states WHERE state_code = 'UP'), 28.9845, 77.7064, true, 1305429),
('Noida', (SELECT id FROM states WHERE state_code = 'UP'), 28.5355, 77.3910, true, 642381);

-- Gujarat
INSERT INTO public.cities (name, state_id, latitude, longitude, is_major, population) VALUES
('Ahmedabad', (SELECT id FROM states WHERE state_code = 'GJ'), 23.0225, 72.5714, true, 7214225),
('Surat', (SELECT id FROM states WHERE state_code = 'GJ'), 21.1702, 72.8311, true, 6081322),
('Vadodara', (SELECT id FROM states WHERE state_code = 'GJ'), 22.3072, 73.1812, true, 2065771),
('Rajkot', (SELECT id FROM states WHERE state_code = 'GJ'), 22.3039, 70.8022, true, 1390640),
('Bhavnagar', (SELECT id FROM states WHERE state_code = 'GJ'), 21.7645, 72.1519, true, 593768);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_states_updated_at
    BEFORE UPDATE ON states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 