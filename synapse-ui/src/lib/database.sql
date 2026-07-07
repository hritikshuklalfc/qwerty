-- Supabase SQL Migration Script for Synapse OS
-- Run this in the Supabase SQL Editor

-- 1. Create Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Leases Table
CREATE TABLE leases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company TEXT NOT NULL,
  property TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  units TEXT,
  move_in TEXT,
  move_out TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Products Table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  brand TEXT,
  short_desc TEXT,
  price NUMERIC,
  compare_price NUMERIC,
  cost_price NUMERIC,
  quantity INTEGER,
  weight NUMERIC,
  sizes TEXT[],
  full_desc TEXT,
  features TEXT,
  shipping_weight NUMERIC,
  processing_time INTEGER,
  return_policy TEXT,
  free_shipping BOOLEAN,
  images JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for leases
CREATE POLICY "Users can view own leases."
  ON leases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leases."
  ON leases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leases."
  ON leases FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leases."
  ON leases FOR DELETE USING (auth.uid() = user_id);

-- Policies for products
CREATE POLICY "Users can view own products."
  ON products FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products."
  ON products FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products."
  ON products FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products."
  ON products FOR DELETE USING (auth.uid() = user_id);
