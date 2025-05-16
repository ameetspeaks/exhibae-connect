-- Add unique constraint for coupon codes
ALTER TABLE coupons
ADD CONSTRAINT coupons_code_unique UNIQUE (code); 