-- Drop existing constraints if they exist
ALTER TABLE IF EXISTS coupons
DROP CONSTRAINT IF EXISTS coupons_organiser_id_fkey;

ALTER TABLE IF EXISTS coupons
DROP CONSTRAINT IF EXISTS coupons_brand_id_fkey;

-- Add foreign key constraints for coupons table
ALTER TABLE coupons
ADD CONSTRAINT coupons_organiser_id_fkey 
FOREIGN KEY (organiser_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE coupons
ADD CONSTRAINT coupons_brand_id_fkey 
FOREIGN KEY (brand_id) 
REFERENCES profiles(id)
ON DELETE SET NULL; 