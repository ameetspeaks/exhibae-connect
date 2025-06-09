-- Disable triggers temporarily
SET session_replication_role = replica;

-- Insert default measuring units if they don't exist
INSERT INTO public.measuring_units (name, symbol, type, description)
SELECT * FROM (
    VALUES 
        ('Meter', 'm', 'length', 'Standard unit of length'),
        ('Centimeter', 'cm', 'length', '1/100 of a meter'),
        ('Foot', 'ft', 'length', 'Imperial unit of length'),
        ('Square Meter', 'm²', 'area', 'Standard unit of area'),
        ('Square Foot', 'ft²', 'area', 'Imperial unit of area'),
        ('Square Yard', 'yd²', 'area', 'Imperial unit of area')
) AS v(name, symbol, type, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.measuring_units
    WHERE name = v.name AND symbol = v.symbol
);

-- Enable triggers again
SET session_replication_role = DEFAULT; 