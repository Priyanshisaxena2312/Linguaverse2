-- Migration: Separate Analysis Structures
-- This script ensures that written entries use the 'analysis' column
-- while spoken entries use the 'speaking_analysis' column.

-- 1. Ensure the 'analysis' column exists for written feedback (3 pillars)
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS analysis jsonb;

-- 2. Ensure 'speaking_analysis' exists for audio feedback (4 pillars) 
-- (This should already exist based on database.md)
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS speaking_analysis jsonb;

-- 3. Optimization: Add an index for analysis-heavy queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_analysis ON public.journal_entries USING gin (analysis);
CREATE INDEX IF NOT EXISTS idx_journal_entries_speaking_analysis ON public.journal_entries USING gin (speaking_analysis);

-- 4. Note on Data Path:
-- Written: analysis -> language: { grammaticalAccuracy, vocabularyRichness, fluencyAndCohesion }
-- Spoken: speaking_analysis -> { grammarScore, vocabularyScore, fluencyScore, clarityScore }
