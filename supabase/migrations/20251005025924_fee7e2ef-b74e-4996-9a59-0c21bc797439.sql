-- Update the streak calculation to require at least 25 minutes of study
CREATE OR REPLACE FUNCTION public.calculate_user_streak(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  -- Check if user studied today or yesterday (at least 25 minutes) to start counting
  IF NOT EXISTS (
    SELECT 1 FROM public.study_stats 
    WHERE user_id = user_id_param 
    AND date = CURRENT_DATE 
    AND total_study_minutes >= 25
  ) THEN
    -- If no study today, check yesterday
    IF NOT EXISTS (
      SELECT 1 FROM public.study_stats 
      WHERE user_id = user_id_param 
      AND date = CURRENT_DATE - INTERVAL '1 day' 
      AND total_study_minutes >= 25
    ) THEN
      RETURN 0;
    END IF;
    check_date := CURRENT_DATE - INTERVAL '1 day';
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