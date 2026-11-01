
-- Table for storing practice session history and reports
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    quiz_score TEXT,
    chat_history TEXT NOT NULL,
    performance_report TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own practice sessions
CREATE POLICY "Users can view their own practice sessions"
ON public.practice_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can create their own practice sessions
CREATE POLICY "Users can create their own practice sessions"
ON public.practice_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
