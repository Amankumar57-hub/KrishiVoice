-- Migration to add email column to profiles table
ALTER TABLE profiles ADD COLUMN email TEXT;