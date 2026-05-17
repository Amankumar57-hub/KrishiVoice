-- Migration to add voice_language column to profiles table
ALTER TABLE profiles ADD COLUMN voice_language TEXT DEFAULT 'hi-IN';