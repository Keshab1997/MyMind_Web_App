# Nested Spaces Database Setup

## SQL Migration

Supabase Dashboard এ গিয়ে SQL Editor তে এই কোড রান করো:

```sql
-- Create spaces table for nested folders
CREATE TABLE IF NOT EXISTS spaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add space_id column to mind_links table
ALTER TABLE mind_links 
ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_spaces_parent_id ON spaces(parent_id);
CREATE INDEX IF NOT EXISTS idx_mind_links_space_id ON mind_links(space_id);

-- Enable Row Level Security
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spaces table
CREATE POLICY "Users can view their own spaces"
    ON spaces FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spaces"
    ON spaces FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces"
    ON spaces FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
    ON spaces FOR DELETE
    USING (auth.uid() = user_id);
```

## Features

✅ **Nested Folders**: ফোল্ডারের ভেতর সাব-ফোল্ডার তৈরি করা যাবে (unlimited depth)
✅ **Breadcrumb Navigation**: কোন ফোল্ডারে আছো সেটা দেখা যাবে এবং সহজে navigate করা যাবে
✅ **Cascade Delete**: Parent folder ডিলিট করলে সব child folders ও ডিলিট হবে
✅ **Move Items**: Detail page থেকে যেকোনো item কে space এ move করা যাবে
✅ **User Isolation**: প্রতিটি user শুধু নিজের spaces দেখতে পারবে (RLS enabled)

## Usage

1. Supabase Dashboard → SQL Editor → উপরের SQL কোড paste করে RUN করো
2. App এ গিয়ে "Spaces" tab এ ক্লিক করো
3. "+" বাটনে ক্লিক করে নতুন space তৈরি করো
4. যেকোনো space এ ক্লিক করলে তার ভেতরে ঢুকবে
5. ভেতরে আবার নতুন sub-folder তৈরি করা যাবে
6. Detail page থেকে items কে spaces এ move করা যাবে

## Database Structure

```
spaces
├── id (UUID, Primary Key)
├── name (TEXT)
├── parent_id (UUID, Foreign Key → spaces.id) [NULL = root level]
├── user_id (UUID, Foreign Key → auth.users.id)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

mind_links
└── space_id (UUID, Foreign Key → spaces.id) [NULL = not in any space]
```
