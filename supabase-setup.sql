-- ==============================================================================
-- Linguaverse - Complete Supabase Setup Script (All-in-One Seed File)
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Project Dashboard: https://supabase.com/dashboard
-- 2. Navigate to "SQL Editor" on the left sidebar
-- 3. Click "New query", paste the entire contents of this file, and click "Run" (Ctrl+Enter)
-- 4. Everything will be configured automatically:
--    - Extensions (UUID & pgcrypto)
--    - All Tables & Relations (profiles, journal_entries, to-do, dictionary, vocabulary, etc.)
--    - Row Level Security (RLS) Policies (isolated to each authenticated user)
--    - Storage Bucket (journal-media for voice recordings & images)
--    - Auth Triggers (auto-creates profile when a user signs up)
--    - Analytics & RPC Functions
--    - Default System Settings Seed
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    contact_mail TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    db_plan TEXT NOT NULL DEFAULT 'free',
    role TEXT DEFAULT 'user',
    ai_analysis_enabled BOOLEAN DEFAULT true,
    ai_improvement_enabled BOOLEAN DEFAULT true,
    profile_setup_complete BOOLEAN DEFAULT false,
    theme_preference TEXT DEFAULT 'default',
    analysis_used INTEGER NOT NULL DEFAULT 0,
    chat_entries_used INTEGER NOT NULL DEFAULT 0,
    voice_entries_used INTEGER NOT NULL DEFAULT 0,
    summaries_used INTEGER NOT NULL DEFAULT 0,
    reports_used INTEGER NOT NULL DEFAULT 0,
    daily_questions_asked INTEGER NOT NULL DEFAULT 0,
    last_question_date DATE,
    usage_reset_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_streak INTEGER NOT NULL DEFAULT 0,
    highest_streak INTEGER NOT NULL DEFAULT 0,
    last_entry_date DATE,
    trial_started_at TIMESTAMPTZ DEFAULT now(),
    pin TEXT,
    pin_lock_enabled BOOLEAN DEFAULT false,
    institution_type TEXT,
    institution_name TEXT,
    age INTEGER,
    class_level TEXT,
    stream TEXT,
    year TEXT,
    phone TEXT,
    branch TEXT,
    section TEXT,
    managed_classes TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure any existing table has all columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS db_plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_analysis_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_improvement_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_setup_complete BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_lock_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS managed_classes TEXT[] DEFAULT '{}'::text[];

-- ------------------------------------------------------------------------------
-- 4. ASSIGNMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    institution_name TEXT,
    branch TEXT,
    section TEXT
);

-- ------------------------------------------------------------------------------
-- 5. JOURNAL ENTRIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'manual',
    analysis JSONB,
    language_analysis JSONB,
    speaking_analysis JSONB,
    theme TEXT DEFAULT 'default',
    page_style TEXT DEFAULT 'default',
    is_project_log BOOLEAN NOT NULL DEFAULT false,
    iterations JSONB,
    conversation JSONB,
    tags TEXT[] DEFAULT '{}'::text[],
    is_submitted BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ,
    teacher_feedback TEXT,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    audio_url TEXT,
    audio_duration NUMERIC
);

-- Ensure all columns exist if the table was previously created
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS analysis JSONB;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS language_analysis JSONB;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS speaking_analysis JSONB;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS teacher_feedback TEXT;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS audio_duration NUMERIC;

-- ------------------------------------------------------------------------------
-- 6. SUBMISSIONS & SUBMISSION DETAILS TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.submission_details (
    submission_id UUID PRIMARY KEY,
    assignment_id UUID,
    assignment_title TEXT,
    student_id UUID,
    student_name TEXT,
    student_email TEXT,
    entry_id UUID,
    entry_title TEXT,
    submitted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 7. TO-DO LISTS & TASKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.todo_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.todo_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.todo_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'inprogress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'))
);

-- ------------------------------------------------------------------------------
-- 8. VOCABULARY & DICTIONARY TABLES
-- ------------------------------------------------------------------------------
-- Saved Dictionary Corrections
CREATE TABLE IF NOT EXISTS public.dictionary_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    word TEXT NOT NULL,
    original_context TEXT NOT NULL,
    corrected_context TEXT NOT NULL,
    explanation TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'written' CHECK (type IN ('written', 'audio')),
    pronunciation_url TEXT
);

-- Word Lookup & Study Bank
CREATE TABLE IF NOT EXISTS public.hard_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    explanation TEXT NOT NULL,
    use_case TEXT NOT NULL
);

-- Word Comparison (Nuances & Context)
CREATE TABLE IF NOT EXISTS public.compared_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    word1 TEXT NOT NULL,
    word2 TEXT NOT NULL,
    comparison_details TEXT NOT NULL
);

-- Sentence Context Comparison
CREATE TABLE IF NOT EXISTS public.compared_sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sentence_1 TEXT NOT NULL,
    sentence_2 TEXT NOT NULL,
    context_class TEXT NOT NULL,
    use_case TEXT NOT NULL,
    subtle_differences TEXT NOT NULL
);

-- Practice Sessions History
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    quiz_score TEXT,
    chat_history JSONB DEFAULT '[]'::jsonb,
    performance_report TEXT
);

-- Grammar Mistake Tracking
CREATE TABLE IF NOT EXISTS public.grammar_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    mistake_category TEXT NOT NULL,
    explanation TEXT,
    branch TEXT,
    section TEXT
);

-- ------------------------------------------------------------------------------
-- 9. SYSTEM SETTINGS & NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    ai_writing_enabled BOOLEAN NOT NULL DEFAULT true,
    ai_writing_disabled_classes TEXT[] DEFAULT '{}'::text[]
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hard_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compared_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compared_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Assignments Policies
DROP POLICY IF EXISTS "Users can see assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can see assignments for their class or manage them" ON public.assignments;

CREATE POLICY "Users can see assignments" ON public.assignments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create assignments" ON public.assignments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update assignments" ON public.assignments
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete assignments" ON public.assignments
    FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Journal Entries Policies
DROP POLICY IF EXISTS "Users can manage their own journal entries." ON public.journal_entries;
DROP POLICY IF EXISTS "Users can view their own entries." ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert their own entries." ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own entries." ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own entries." ON public.journal_entries;

CREATE POLICY "Users can manage their own journal entries." ON public.journal_entries
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Submissions Policies
DROP POLICY IF EXISTS "Users can manage their submissions" ON public.submissions;
CREATE POLICY "Users can manage their submissions" ON public.submissions
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read submission details" ON public.submission_details;
CREATE POLICY "Admins can read submission details" ON public.submission_details
    FOR SELECT TO authenticated USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR student_id = auth.uid()
    );

-- To-Do Lists & Tasks Policies
DROP POLICY IF EXISTS "Users can manage their own to-do lists." ON public.todo_lists;
DROP POLICY IF EXISTS "Users can manage their own todo lists" ON public.todo_lists;
CREATE POLICY "Users can manage their own to-do lists." ON public.todo_lists
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own tasks." ON public.todo_tasks;
DROP POLICY IF EXISTS "Users can manage tasks in their own lists" ON public.todo_tasks;
CREATE POLICY "Users can manage their own tasks." ON public.todo_tasks
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dictionary Words Policies
DROP POLICY IF EXISTS "Users can manage their own dictionary words" ON public.dictionary_words;
DROP POLICY IF EXISTS "Users can view their own dictionary words." ON public.dictionary_words;
CREATE POLICY "Users can manage their own dictionary words" ON public.dictionary_words
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hard Words Policies
DROP POLICY IF EXISTS "Users can manage their own hard words" ON public.hard_words;
CREATE POLICY "Users can manage their own hard words" ON public.hard_words
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Compared Words Policies
DROP POLICY IF EXISTS "Users can manage their own compared words" ON public.compared_words;
CREATE POLICY "Users can manage their own compared words" ON public.compared_words
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Compared Sentences Policies
DROP POLICY IF EXISTS "Users can manage their own compared sentences" ON public.compared_sentences;
CREATE POLICY "Users can manage their own compared sentences" ON public.compared_sentences
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Practice Sessions Policies
DROP POLICY IF EXISTS "Users can manage their own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users can manage their own practice sessions" ON public.practice_sessions
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grammar Mistakes Policies
DROP POLICY IF EXISTS "Users can manage their own grammar mistakes" ON public.grammar_mistakes;
CREATE POLICY "Users can manage their own grammar mistakes" ON public.grammar_mistakes
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- App Settings Policies (Anyone can read, admin or service role can edit)
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;
CREATE POLICY "Anyone can view app settings" ON public.app_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
CREATE POLICY "Admins can update app settings" ON public.app_settings
    FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Push Subscriptions Policies
DROP POLICY IF EXISTS "Users can manage their push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their push subscriptions" ON public.push_subscriptions
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    contact_mail,
    plan,
    db_plan,
    role,
    ai_analysis_enabled,
    ai_improvement_enabled,
    trial_started_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Member'),
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'contact_mail', ''),
    'free',
    'free',
    'user',
    true,
    true,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for submissions denormalization
CREATE OR REPLACE FUNCTION public.handle_new_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment_title text;
    v_student_name text;
    v_student_email text;
    v_entry_title text;
BEGIN
    SELECT title INTO v_assignment_title FROM public.assignments WHERE id = NEW.assignment_id;
    SELECT full_name, contact_mail INTO v_student_name, v_student_email FROM public.profiles WHERE id = NEW.user_id;
    SELECT title INTO v_entry_title FROM public.journal_entries WHERE id = NEW.journal_entry_id;

    INSERT INTO public.submission_details (
        submission_id,
        assignment_id,
        assignment_title,
        student_id,
        student_name,
        student_email,
        entry_id,
        entry_title,
        submitted_at
    )
    VALUES (
        NEW.id,
        NEW.assignment_id,
        v_assignment_title,
        NEW.user_id,
        v_student_name,
        v_student_email,
        NEW.journal_entry_id,
        v_entry_title,
        NEW.created_at
    )
    ON CONFLICT (submission_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_submission_created ON public.submissions;
CREATE TRIGGER on_submission_created
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_submission();

-- ------------------------------------------------------------------------------
-- 12. STORAGE BUCKET CONFIGURATION
-- ------------------------------------------------------------------------------
-- Create bucket for journal media, audio recordings & pronunciation files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'journal-media',
    'journal-media',
    false,
    10485760, -- 10MB limit per file
    '{"image/png", "image/jpeg", "image/webp", "image/gif", "audio/mpeg", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg", "audio/x-m4a"}'
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = '{"image/png", "image/jpeg", "image/webp", "image/gif", "audio/mpeg", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg", "audio/x-m4a"}';

-- Storage RLS Policies
DROP POLICY IF EXISTS "Users can view their own media." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload media." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media." ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own dictionary audio" ON storage.objects;

CREATE POLICY "Users can view their own media." ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload media." ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media." ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media." ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ------------------------------------------------------------------------------
-- 13. ANALYTICS & DASHBOARD RPC FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_entries', (SELECT COUNT(*) FROM public.journal_entries),
    'total_ai_calls', (SELECT COALESCE(SUM(chat_entries_used + voice_entries_used + analysis_used + summaries_used + reports_used), 0) FROM public.profiles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_plan_distribution()
RETURNS TABLE (plan text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    profiles.plan,
    COUNT(profiles.id)
  FROM
    public.profiles
  GROUP BY
    profiles.plan;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_active_users_counts(onedayago text, sevendaysago text, thirtydaysago text)
RETURNS TABLE (daily_active bigint, weekly_active bigint, monthly_active bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM public.journal_entries WHERE created_at >= onedayago::timestamptz) AS daily_active,
    (SELECT COUNT(DISTINCT user_id) FROM public.journal_entries WHERE created_at >= sevendaysago::timestamptz) AS weekly_active,
    (SELECT COUNT(DISTINCT user_id) FROM public.journal_entries WHERE created_at >= thirtydaysago::timestamptz) AS monthly_active;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_entry_method_distribution()
RETURNS TABLE (source text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    journal_entries.source,
    COUNT(journal_entries.id)
  FROM
    public.journal_entries
  GROUP BY
    journal_entries.source;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_journal_type_distribution()
RETURNS TABLE (is_project_log boolean, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    journal_entries.is_project_log,
    COUNT(journal_entries.id)
  FROM
    public.journal_entries
  GROUP BY
    journal_entries.is_project_log;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_total_ai_usage()
RETURNS TABLE (total_calls bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(chat_entries_used + voice_entries_used + analysis_used + summaries_used + reports_used), 0)::bigint
  FROM
    public.profiles;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 14. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_assignment_id ON public.journal_entries(assignment_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_analysis ON public.journal_entries USING gin (analysis);
CREATE INDEX IF NOT EXISTS idx_journal_entries_speaking_analysis ON public.journal_entries USING gin (speaking_analysis);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id ON public.todo_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_list_id ON public.todo_tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_id ON public.todo_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_words_user_id ON public.dictionary_words(user_id);
CREATE INDEX IF NOT EXISTS idx_hard_words_user_id ON public.hard_words(user_id);
CREATE INDEX IF NOT EXISTS idx_compared_words_user_id ON public.compared_words(user_id);
CREATE INDEX IF NOT EXISTS idx_compared_sentences_user_id ON public.compared_sentences(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_mistakes_user_id ON public.grammar_mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- ------------------------------------------------------------------------------
-- 15. INITIAL DEFAULT SEED DATA
-- ------------------------------------------------------------------------------
-- Ensure default global app settings exist
INSERT INTO public.app_settings (id, ai_writing_enabled, ai_writing_disabled_classes)
VALUES (1, true, '{}')
ON CONFLICT (id) DO NOTHING;

-- Done!
-- ==============================================================================
