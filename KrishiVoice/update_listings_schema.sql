-- Migration to add quality details and photo upload fields to listings table
ALTER TABLE listings ADD COLUMN photo_url TEXT;
ALTER TABLE listings ADD COLUMN grade TEXT;
ALTER TABLE listings ADD COLUMN harvest_date DATE;
ALTER TABLE listings ADD COLUMN moisture DECIMAL(5,2); -- e.g., 12.50 for 12.5%
ALTER TABLE listings ADD COLUMN bag_count INTEGER;
ALTER TABLE listings ADD COLUMN is_organic BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN delivery_option TEXT; -- 'delivery', 'pickup', 'both'