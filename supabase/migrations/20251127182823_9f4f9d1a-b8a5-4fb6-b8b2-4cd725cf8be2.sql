-- Fix function search paths for security
-- This ensures functions use the correct schema and prevents potential security issues

-- Update upsert_study_stats function to have explicit search_path
CREATE OR REPLACE FUNCTION public.upsert_study_stats(p_user_id uuid, p_date date, p_minutes integer, p_sessions_increment integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Update calculate_user_streak function to have explicit search_path (already has it, but ensuring)
CREATE OR REPLACE FUNCTION public.calculate_user_streak(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE;
  has_min_study BOOLEAN;
BEGIN
  -- Start from today
  check_date := CURRENT_DATE;
  
  -- First, check if user has studied today (at least 25 minutes)
  SELECT EXISTS (
    SELECT 1 FROM public.study_stats 
    WHERE user_id = user_id_param 
    AND date = check_date 
    AND total_study_minutes >= 25
  ) INTO has_min_study;
  
  -- If no study today, check yesterday
  IF NOT has_min_study THEN
    check_date := CURRENT_DATE - INTERVAL '1 day';
    
    SELECT EXISTS (
      SELECT 1 FROM public.study_stats 
      WHERE user_id = user_id_param 
      AND date = check_date 
      AND total_study_minutes >= 25
    ) INTO has_min_study;
    
    -- If no study yesterday either, streak is 0
    IF NOT has_min_study THEN
      RETURN 0;
    END IF;
  END IF;

  -- Count consecutive days backwards (minimum 25 minutes per day)
  WHILE EXISTS (
    SELECT 1 FROM public.study_stats 
    WHERE user_id = user_id_param 
    AND date = check_date 
    AND total_study_minutes >= 25
  ) LOOP
    current_streak := current_streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;

  RETURN current_streak;
END;
$function$;

-- Update apply_session_to_study_stats function to have explicit search_path
CREATE OR REPLACE FUNCTION public.apply_session_to_study_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
declare
  v_date date;
begin
  -- Only count study time; treat null session_type as 'study'
  if coalesce(new.session_type, 'study') = 'study' then
    v_date := (new.completed_at at time zone 'utc')::date;

    -- Upsert today's aggregate for the session's date
    insert into public.study_stats (user_id, date, total_study_minutes, sessions_count)
    values (new.user_id, v_date, coalesce(new.duration_minutes, 0), 1)
    on conflict (user_id, date) do update
      set total_study_minutes = public.study_stats.total_study_minutes + coalesce(excluded.total_study_minutes, 0),
          sessions_count      = public.study_stats.sessions_count + 1,
          updated_at          = now();

    -- Update streak_days snapshot on current date
    insert into public.study_stats (user_id, date, total_study_minutes, sessions_count, streak_days)
    values (new.user_id, current_date, 0, 0, public.calculate_user_streak(new.user_id))
    on conflict (user_id, date) do update
      set streak_days = public.calculate_user_streak(new.user_id),
          updated_at  = now();
  end if;

  return new;
end;
$function$;