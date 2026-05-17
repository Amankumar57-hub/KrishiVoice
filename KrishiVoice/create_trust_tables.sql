-- Create ratings table for star ratings on listings and profiles
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  user_id UUID REFERENCES auth.users(id), -- the user being rated (seller)
  rater_id UUID REFERENCES auth.users(id), -- the user giving the rating
  rating INTEGER CHECK (rating >=1 AND rating <=5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create reports table for fraud reports
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);