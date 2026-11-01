
-- Step 1: Create the denormalized table to store submission details
CREATE TABLE IF NOT EXISTS public.submission_details (
    submission_id uuid PRIMARY KEY,
    assignment_id uuid,
    assignment_title text,
    student_id uuid,
    student_name text,
    student_email text,
    entry_id uuid,
    entry_title text,
    submitted_at timestamptz
);

-- Step 2: Create a function that will be triggered on new submissions
CREATE OR REPLACE FUNCTION public.handle_new_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to query other tables, bypassing RLS for this specific action
AS $$
DECLARE
    v_assignment_title text;
    v_student_name text;
    v_student_email text;
    v_entry_title text;
BEGIN
    -- Get assignment title
    SELECT title INTO v_assignment_title FROM public.assignments WHERE id = NEW.assignment_id;

    -- Get student details
    SELECT full_name, email INTO v_student_name, v_student_email FROM public.profiles WHERE id = NEW.user_id;

    -- Get journal entry title
    SELECT title INTO v_entry_title FROM public.journal_entries WHERE id = NEW.journal_entry_id;

    -- Insert the flattened data into our new table
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
    );

    RETURN NEW;
END;
$$;

-- Step 3: Create the trigger that calls the function after a new row is added to submissions
DROP TRIGGER IF EXISTS on_submission_created ON public.submissions; -- Drop existing trigger to be safe
CREATE TRIGGER on_submission_created
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_submission();

-- Step 4: (Optional but recommended) Add an RLS policy so only admins can read this table
ALTER TABLE public.submission_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read submission details" ON public.submission_details;
CREATE POLICY "Admins can read submission details"
ON public.submission_details
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
