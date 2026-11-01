
-- Drop the old function if it exists to allow for changing the return type
DROP FUNCTION IF EXISTS get_grammar_analysis_for_class(text, text, timestamp with time zone, timestamp with time zone);

-- RPC function to get grammar analysis for a specific class
CREATE OR REPLACE FUNCTION get_grammar_analysis_for_class(
    p_branch text,
    p_section text,
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS TABLE(
    category text,
    count bigint,
    student_count bigint,
    total_students bigint,
    total_mistakes bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_students bigint;
    v_total_mistakes bigint;
BEGIN
    -- Get the total number of students in the class
    SELECT COUNT(*)
    INTO v_total_students
    FROM profiles
    WHERE lower(profiles.branch) = lower(p_branch) AND lower(profiles.section) = lower(p_section);

    -- Get the total number of mistakes for the date range and class
    SELECT COUNT(*)
    INTO v_total_mistakes
    FROM grammar_mistakes
    WHERE
        grammar_mistakes.branch = p_branch AND
        grammar_mistakes.section = p_section AND
        grammar_mistakes.created_at >= p_start_date AND
        grammar_mistakes.created_at <= p_end_date;

    -- Return the breakdown by category
    RETURN QUERY
    SELECT
        m.mistake_category::text AS category,
        COUNT(m.id)::bigint AS count,
        COUNT(DISTINCT m.user_id)::bigint AS student_count,
        v_total_students AS total_students,
        v_total_mistakes AS total_mistakes
    FROM grammar_mistakes m
    WHERE
        m.branch = p_branch AND
        m.section = p_section AND
        m.created_at >= p_start_date AND
        m.created_at <= p_end_date
    GROUP BY m.mistake_category;
END;
$$;
