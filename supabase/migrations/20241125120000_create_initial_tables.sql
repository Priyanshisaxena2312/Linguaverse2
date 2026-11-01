-- Create the journal_entries table
CREATE TABLE public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    analysis JSONB
);

-- Add comments to the table and columns
COMMENT ON TABLE public.journal_entries IS 'Stores journal entries for users.';
COMMENT ON COLUMN public.journal_entries.id IS 'Unique identifier for each journal entry.';
COMMENT ON COLUMN public.journal_entries.user_id IS 'The user who created the entry.';
COMMENT ON COLUMN public.journal_entries.created_at IS 'The timestamp when the entry was created.';
COMMENT ON COLUMN public.journal_entries.title IS 'The title of the journal entry.';
COMMENT ON COLUMN public.journal_entries.content IS 'The content of the journal entry.';
COMMENT ON COLUMN public.journal_entries.analysis IS 'Stores AI-generated analysis of the entry.';

-- Enable Row Level Security (RLS) for the table
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- 1. Policy to allow users to insert their own entries
CREATE POLICY "Users can insert their own journal entries."
ON public.journal_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Policy to allow users to view their own entries
CREATE POLICY "Users can view their own journal entries."
ON public.journal_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Policy to allow users to update their own entries
CREATE POLICY "Users can update their own journal entries."
ON public.journal_entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Policy to allow users to delete their own entries
CREATE POLICY "Users can delete their own journal entries."
ON public.journal_entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create a table for user profiles to store additional info
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  primary key (id)
);
-- enable RLS
alter table public.profiles enable row level security;
-- read access for everyone
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );
-- write access for user
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
-- trigger to create a profile when a new user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
