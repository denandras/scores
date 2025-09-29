# Database Schema

This document describes the database schema for the Secure Database application.

## Tables

### user_profiles
Extends Supabase's built-in auth.users table with application-specific data.

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile (except role)
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only admins can insert new profiles or change roles
CREATE POLICY "Admins can manage user profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### records
Stores main database records.

```sql
CREATE TABLE records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view records
CREATE POLICY "Authenticated users can view records" ON records
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can insert records
CREATE POLICY "Authenticated users can insert records" ON records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own records, admins can update all
CREATE POLICY "Users can update their own records" ON records
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete their own records, admins can delete all
CREATE POLICY "Users can delete their own records" ON records
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### files
Stores file metadata for uploaded files.

```sql
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT,
  mega_file_id TEXT NOT NULL,
  download_url TEXT,
  uploaded_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view files
CREATE POLICY "Authenticated users can view files" ON files
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can insert files
CREATE POLICY "Authenticated users can insert files" ON files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can delete their own files, admins can delete all
CREATE POLICY "Users can delete their own files" ON files
  FOR DELETE USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Functions

### Handle new user registration
```sql
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

## Setup Instructions

1. Create a new Supabase project
2. Run the SQL commands above in the Supabase SQL editor
3. Configure Google OAuth in Supabase Auth settings
4. Update your environment variables with Supabase keys
5. Set the first admin user by manually updating their role in the database