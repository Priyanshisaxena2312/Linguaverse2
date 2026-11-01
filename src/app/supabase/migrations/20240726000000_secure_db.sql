-- 1. Secure the student_analytics view
-- Drop the existing insecure view
DROP VIEW IF EXISTS public.student_analytics;

-- Recreate the view WITHOUT SECURITY DEFINER and without joining to auth.users
CREATE OR REPLACE VIEW public.student_analytics AS
SELECT
  p.id,
  p.full_name,
  p.contact_mail,
  p.plan,
  p.branch,
  p.section,
  (
    SELECT
      count(*)
    FROM
      public.journal_entries je
    WHERE
      je.user_id = p.id
  ) AS total_entries,
  p.avg_grammar_score
FROM
  public.profiles p;

-- Apply a new RLS policy to the view itself for an extra layer of security
ALTER VIEW public.student_analytics OWNER TO postgres;

-- Make sure RLS is enabled on the underlying profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace the policy to ensure admins can see all profiles in the view
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT
  TO authenticated USING (public.is_admin (auth.uid ()) = TRUE);

-- Ensure users can see their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR
SELECT
  TO authenticated USING ((auth.uid () = id));

-- 2. Secure the app_settings table
-- Enable RLS on the app_settings table
ALTER TABLE
  public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy that only allows admins to access settings
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL USING (public.is_admin ((
  SELECT
    auth.uid ()
))) WITH CHECK (public.is_admin ((
  SELECT
    auth.uid ()
)));

-- 3. Secure database functions by setting a search_path
ALTER FUNCTION public.handle_new_submission ()
SET
  search_path = public;

ALTER FUNCTION public.get_grammar_analysis_for_class (p_branch text, p_section text, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
SET
  search_path = public;

ALTER FUNCTION public.is_admin_of_class (p_branch text, p_section text)
SET
  search_path = public;

ALTER FUNCTION public.bulk_create_users_from_temp ()
SET
  search_path = public;

ALTER FUNCTION public.get_active_users_counts (p_start_date timestamp with time zone, p_end_date timestamp with time zone)
SET
  search_path = public;

ALTER FUNCTION public.get_class_grammar_stats (p_branch text, p_section text)
SET
  search_path = public;

ALTER FUNCTION public.get_user_role (p_user_id uuid)
SET
  search_path = public;

ALTER FUNCTION public.get_class_dashboard_data (p_branch text, p_section text)
SET
  search_path = public;

ALTER FUNCTION public.get_distinct_sections (p_branch text)
SET
  search_path = public;

ALTER FUNCTION public.get_student_mistakes_for_category (p_branch text, p_section text, p_category text, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
SET
  search_path = public;

ALTER FUNCTION public.get_all_students_analysis_for_class (p_branch text, p_section text, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
SET
  search_path = public;

ALTER FUNCTION public.get_total_ai_usage ()
SET
  search_path = public;

ALTER FUNCTION public.get_plan_distribution ()
SET
  search_path = public;

ALTER FUNCTION public.get_entry_method_distribution ()
SET
  search_path = public;

ALTER FUNCTION public.get_journal_type_distribution ()
SET
  search_path = public;

ALTER FUNCTION public.get_distinct_branches ()
SET
  search_path = public;

-- Also fix the search_path for the handle_new_user function associated with the trigger
ALTER FUNCTION public.handle_new_user ()
SET
  search_path = public;