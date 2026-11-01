
-- This file contains SQL statements to update the database schema for new features.

-- Create the hard_words table for the Word Lookup feature
CREATE TABLE public.hard_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    explanation TEXT NOT NULL,
    use_case TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.hard_words ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own hard words"
ON public.hard_words FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hard words"
ON public.hard_words FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hard words"
ON public.hard_words FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hard words"
ON public.hard_words FOR DELETE
USING (auth.uid() = user_id);
