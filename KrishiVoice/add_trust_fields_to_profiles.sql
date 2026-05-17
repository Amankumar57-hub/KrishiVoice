-- Migration to add verified field to profiles table
ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false;

-- Add successful_listings count to profiles for repeat seller history
ALTER TABLE profiles ADD COLUMN successful_listings INTEGER DEFAULT 0;