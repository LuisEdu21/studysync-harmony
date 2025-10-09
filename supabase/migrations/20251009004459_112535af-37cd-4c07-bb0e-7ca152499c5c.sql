-- Create atomic upsert function for study_stats to prevent duplicate key violations
CREATE OR REPLACE FUNCTION public.upsert_study_stats(
  p_user_id UUID,
  p_date DATE,
  p_minutes INTEGER,
  p_sessions_increment INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak INTEGER;
BEGIN
  -- Calculate current streak
  v_current_streak := public.calculate_user_streak(p_user_id);
  
  -- Insert or update atomically
  INSERT INTO public.study_stats (
    user_id, 
    date, 
    total_study_minutes, 
    sessions_count,
    streak_days
  )
  VALUES (
    p_user_id,
    p_date,
    p_minutes,
    p_sessions_increment,
    v_current_streak
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_study_minutes = public.study_stats.total_study_minutes + EXCLUDED.total_study_minutes,
    sessions_count = public.study_stats.sessions_count + EXCLUDED.sessions_count,
    streak_days = v_current_streak,
    updated_at = now();
END;
$$;