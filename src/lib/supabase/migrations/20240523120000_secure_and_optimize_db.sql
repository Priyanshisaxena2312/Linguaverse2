-- 1. Enable RLS on app_settings and create policies
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings"
ON public.app_settings
FOR ALL
USING (auth.role() = 'service_role' OR get_user_role(auth.uid()) = 'admin');

-- 2. Secure database functions by setting a search_path
ALTER FUNCTION public.handle_new_submission() SET search_path = public;
ALTER FUNCTION public.get_grammar_analysis_for_class(p_branch text, p_section text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.is_admin_of_class(p_user_id uuid, p_branch text, p_section text) SET search_path = public;
ALTER FUNCTION public.get_class_dashboard_data(p_branch text, p_section text) SET search_path = public;
ALTER FUNCTION public.get_student_mistakes_for_category(p_branch text, p_section text, p_category text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_all_students_analysis_for_class(p_branch text, p_section text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_total_ai_usage() SET search_path = public;
ALTER FUNCTION public.get_user_role(p_user_id uuid) SET search_path = public;


-- 3. Re-create the student_analytics view to be secure and performant
DROP VIEW IF EXISTS public.student_analytics;
CREATE OR REPLACE VIEW public.student_analytics AS
SELECT
    p.id,
    p.full_name,
    p.contact_mail,
    p.plan,
    p.branch,
    p.section,
    count(je.id) AS total_entries,
    avg((je.analysis -> 'language' ->> 'grammaticalAccuracy')::numeric) AS avg_grammar_score
FROM
    public.profiles p
LEFT JOIN
    public.journal_entries je ON p.id = je.user_id
GROUP BY
    p.id, p.full_name, p.contact_mail, p.plan, p.branch, p.section;


-- 4. Apply optimized RLS policies to all relevant tables

-- public.profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- public.journal_entries
DROP POLICY IF EXISTS "Users can manage their own journal entries" ON public.journal_entries;
CREATE POLICY "Users can manage their own journal entries" ON public.journal_entries FOR ALL USING ((select auth.uid()) = user_id);

-- public.assignments
DROP POLICY IF EXISTS "Teachers can manage assignments for their classes" ON public.assignments;
DROP POLICY IF EXISTS "Students can see assignments for their class" ON public.assignments;
CREATE POLICY "Users can access assignments" ON public.assignments FOR SELECT USING (
    (get_user_role(auth.uid()) = 'admin') OR 
    (branch = (SELECT b.branch FROM profiles b WHERE b.id = auth.uid()) AND section = (SELECT s.section FROM profiles s WHERE s.id = auth.uid()))
);
CREATE POLICY "Admins can manage assignments" ON public.assignments FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- public.grammar_mistakes
DROP POLICY IF EXISTS "Users can view their own grammar mistakes" ON public.grammar_mistakes;
DROP POLICY IF EXISTS "Users can insert their own grammar mistakes" ON public.grammar_mistakes;
DROP POLICY IF EXISTS "Admins can access all grammar mistakes" ON public.grammar_mistakes;
CREATE POLICY "Users can manage their own grammar mistakes" ON public.grammar_mistakes FOR ALL USING ((select auth.uid()) = user_id);
CREATE POLICY "Admins can see all grammar mistakes" ON public.grammar_mistakes FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- public.dictionary_words
DROP POLICY IF EXISTS "Users can manage their own dictionary words" ON public.dictionary_words;
CREATE POLICY "Users can manage their own dictionary words" ON public.dictionary_words FOR ALL USING ((select auth.uid()) = user_id);

-- public.todo_lists
DROP POLICY IF EXISTS "Users can manage their own to-do lists" ON public.todo_lists;
CREATE POLICY "Users can manage their own to-do lists" ON public.todo_lists FOR ALL USING ((select auth.uid()) = user_id);

-- public.todo_tasks
DROP POLICY IF EXISTS "Users can manage their own to-do tasks" ON public.todo_tasks;
CREATE POLICY "Users can manage their own to-do tasks" ON public.todo_tasks FOR ALL USING ((select auth.uid()) = user_id);

-- public.hard_words
DROP POLICY IF EXISTS "Users can view their own hard words" ON public.hard_words;
CREATE POLICY "Users can view their own hard words" ON public.hard_words FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert their own hard words" ON public.hard_words;
CREATE POLICY "Users can insert their own hard words" ON public.hard_words FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update their own hard words" ON public.hard_words;
CREATE POLICY "Users can update their own hard words" ON public.hard_words FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete their own hard words" ON public.hard_words;
CREATE POLICY "Users can delete their own hard words" ON public.hard_words FOR DELETE USING ((select auth.uid()) = user_id);

-- public.compared_words
DROP POLICY IF EXISTS "Users can manage their own compared words" ON public.compared_words;
CREATE POLICY "Users can manage their own compared words" ON public.compared_words FOR ALL USING ((select auth.uid()) = user_id);

-- public.practice_sessions
DROP POLICY IF EXISTS "Users can view their own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users can view their own practice sessions" ON public.practice_sessions FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can create their own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users can create their own practice sessions" ON public.practice_sessions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);


-- 5. Add missing indexes to foreign keys
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments (created_by);
CREATE INDEX IF NOT EXISTS idx_dictionary_words_user_id ON public.dictionary_words (user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_mistakes_journal_entry_id ON public.grammar_mistakes (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_grammar_mistakes_user_id ON public.grammar_mistakes (user_id);
CREATE INDEX IF NOT EXISTS idx_hard_words_user_id ON public.hard_words (user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_assignment_id ON public.journal_entries (assignment_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_journal_entry_id ON public.practice_sessions (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id ON public.todo_lists (user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_list_id ON public.todo_tasks (list_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_id ON public.todo_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_compared_words_user_id ON public.compared_words (user_id);
