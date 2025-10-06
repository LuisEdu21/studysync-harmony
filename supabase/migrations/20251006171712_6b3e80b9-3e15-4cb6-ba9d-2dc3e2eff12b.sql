-- Drop and recreate the calculate_user_streak function with correct logic
DROP FUNCTION IF EXISTS public.calculate_user_streak(uuid);

CREATE OR REPLACE FUNCTION public.calculate_user_streak(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update all existing study_stats records to recalculate streak
UPDATE public.study_stats
SET streak_days = public.calculate_user_streak(user_id)
WHERE date = CURRENT_DATE;