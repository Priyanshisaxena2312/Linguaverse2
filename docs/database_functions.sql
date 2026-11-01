
-- This function calculates dashboard stats for a specific class.
-- It requires a p_branch and p_section to identify the class.
-- This version corrects the avg_grammar_score calculation.
CREATE OR REPLACE FUNCTION get_class_dashboard_data(p_branch TEXT, p_section TEXT)
RETURNS TABLE(
    total_students BIGINT,
    total_submissions BIGINT,
    avg_grammar_score FLOAT,
    assignments JSON,
    student_participation JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH class_students AS (
        SELECT id
        FROM profiles
        WHERE branch = p_branch AND section = p_section
    ),
    class_assignments AS (
        SELECT id, title, due_date, created_at
        FROM assignments
        WHERE branch = p_branch AND section = p_section
        ORDER BY created_at DESC
        LIMIT 10
    )
    SELECT
        (SELECT count(*) FROM class_students) AS total_students,
        (SELECT count(*) FROM journal_entries WHERE user_id IN (SELECT id FROM class_students) AND is_submitted = true) AS total_submissions,
        
        -- CORRECTED LOGIC FOR AVERAGE GRAMMAR SCORE
        (SELECT AVG((analysis->'language'->>'grammaticalAccuracy')::float)
         FROM journal_entries
         WHERE user_id IN (SELECT id FROM class_students)
           AND analysis->'language'->>'grammaticalAccuracy' IS NOT NULL) AS avg_grammar_score,
        
        (SELECT json_agg(ca.*) FROM class_assignments ca) AS assignments,
        (SELECT json_agg(sp.*)
         FROM (
             SELECT
                 a.id as assignment_id,
                 a.title as assignment_title,
                 count(je.id) as submission_count
             FROM class_assignments a
             LEFT JOIN journal_entries je ON a.id = je.assignment_id AND je.is_submitted = true
             GROUP BY a.id, a.title
         ) sp
        ) AS student_participation;
END;
$$ LANGUAGE plpgsql;


-- This function retrieves the most common grammar mistakes for a given class and date range.
-- It groups mistakes by category and counts occurrences and unique students.
CREATE OR REPLACE FUNCTION get_grammar_analysis_for_class(p_branch TEXT, p_section TEXT, p_start_date timestamptz, p_end_date timestamptz)
RETURNS TABLE (
    category TEXT,
    count BIGINT,
    student_count BIGINT,
    total_students INT,
    total_mistakes BIGINT
)
AS $$
DECLARE
    v_total_students INT;
    v_total_mistakes BIGINT;
BEGIN
    -- Get the total number of students in the class
    SELECT INTO v_total_students COUNT(*)
    FROM profiles
    WHERE branch = p_branch AND section = p_section;

    -- Get the total number of mistakes for the period
    SELECT INTO v_total_mistakes COUNT(*)
    FROM grammar_mistakes
    WHERE branch = p_branch
      AND section = p_section
      AND created_at >= p_start_date
      AND created_at <= p_end_date;

    RETURN QUERY
    SELECT
        gm.mistake_category AS category,
        COUNT(gm.id) AS count,
        COUNT(DISTINCT gm.user_id) AS student_count,
        v_total_students AS total_students,
        v_total_mistakes AS total_mistakes
    FROM
        grammar_mistakes gm
    WHERE
        gm.branch = p_branch
        AND gm.section = p_section
        AND gm.created_at >= p_start_date
        AND gm.created_at <= p_end_date
    GROUP BY
        gm.mistake_category
    ORDER BY
        count DESC;
END;
$$ LANGUAGE plpgsql;


-- This function gets the number of times each student in a class made a specific category of mistake.
CREATE OR REPLACE FUNCTION get_student_mistakes_for_category(p_branch TEXT, p_section TEXT, p_category TEXT, p_start_date timestamptz, p_end_date timestamptz)
RETURNS TABLE (
    student_name TEXT,
    mistake_count BIGINT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.full_name AS student_name,
        COUNT(gm.id) AS mistake_count
    FROM
        grammar_mistakes gm
    JOIN
        profiles p ON gm.user_id = p.id
    WHERE
        gm.branch = p_branch
        AND gm.section = p_section
        AND gm.mistake_category = p_category
        AND gm.created_at >= p_start_date
        AND gm.created_at <= p_end_date
    GROUP BY
        p.full_name
    ORDER BY
        mistake_count DESC;
END;
$$ LANGUAGE plpgsql;


-- This function retrieves detailed time-series analysis data for all students in a class.
CREATE OR REPLACE FUNCTION get_all_students_analysis_for_class(p_branch TEXT, p_section TEXT, p_start_date timestamptz, p_end_date timestamptz)
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
    data JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS student_id,
        p.full_name AS student_name,
        COALESCE(
            json_agg(
                json_build_object(
                    'date', je.created_at,
                    'grammaticalAccuracy', (je.analysis->'language'->>'grammaticalAccuracy')::numeric,
                    'vocabularyRichness', (je.analysis->'language'->>'vocabularyRichness')::numeric,
                    'fluencyAndCohesion', (je.analysis->'language'->>'fluencyAndCohesion')::numeric,
                    'sentiment', (je.analysis->'personal'->'sentiment'->>'overallScore')::numeric
                ) ORDER BY je.created_at
            ) FILTER (WHERE je.id IS NOT NULL),
            '[]'::json
        ) AS data
    FROM
        profiles p
    LEFT JOIN
        journal_entries je ON p.id = je.user_id
        AND je.created_at >= p_start_date
        AND je.created_at <= p_end_date
        AND je.analysis IS NOT NULL
    WHERE
        p.branch = p_branch AND p.section = p_section
    GROUP BY
        p.id, p.full_name;
END;
$$ LANGUAGE plpgsql;

-- This function retrieves all pending submissions for teachers based on their managed classes.
CREATE OR REPLACE FUNCTION get_pending_submissions(p_branches TEXT[], p_sections TEXT[])
RETURNS TABLE (
    id UUID,
    student_name TEXT,
    class_name TEXT,
    assignment_title TEXT,
    submitted_at TIMESTAMPTZ,
    journal_entry JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.id,
        p.full_name as student_name,
        p.branch || '-' || p.section as class_name,
        a.title as assignment_title,
        je.submitted_at,
        json_build_object(
            'id', je.id,
            'title', je.title,
            'content', je.content,
            'language_analysis', je.language_analysis
        ) as journal_entry
    FROM
        journal_entries je
    JOIN
        profiles p ON je.user_id = p.id
    LEFT JOIN
        assignments a ON je.assignment_id = a.id
    WHERE
        je.is_submitted = true
        AND je.teacher_feedback IS NULL
        AND p.branch = ANY(p_branches)
        AND p.section = ANY(p_sections)
    ORDER BY
        je.submitted_at ASC;
END;
$$ LANGUAGE plpgsql;

-- This function calculates the total number of AI calls made, stored in the profiles table.
CREATE OR REPLACE FUNCTION get_total_ai_usage()
RETURNS TABLE (total_calls BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(
            COALESCE(analysis_used, 0) +
            COALESCE(chat_entries_used, 0) +
            COALESCE(voice_entries_used, 0) +
            COALESCE(summaries_used, 0) +
            COALESCE(reports_used, 0)
        ) as total_calls
    FROM profiles;
END;
$$ LANGUAGE plpgsql;

-- This view provides aggregated analytics for each student.
CREATE OR REPLACE VIEW student_analytics AS
SELECT
  p.id,
  p.full_name,
  p.contact_mail,
  p.plan,
  p.branch,
  p.section,
  count(je.id) AS total_entries,
  avg((je.analysis -> 'language' ->> 'grammaticalAccuracy'::text)::double precision) AS avg_grammar_score
FROM (profiles p
  LEFT JOIN journal_entries je ON ((p.id = je.user_id)))
GROUP BY p.id, p.full_name, p.contact_mail, p.plan, p.branch, p.section;
