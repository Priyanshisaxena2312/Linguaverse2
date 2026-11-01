
-- Table to store user-saved word comparisons
CREATE TABLE IF NOT EXISTS public.compared_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    word1 TEXT NOT NULL,
    word2 TEXT NOT NULL,
    comparison_details TEXT NOT NULL -- Encrypted JSON blob of the comparison
);

-- Enable RLS
ALTER TABLE public.compared_words ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own compared words
CREATE POLICY "Users can manage their own compared words"
ON public.compared_words
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_compared_words_user_id ON public.compared_words(user_id);
