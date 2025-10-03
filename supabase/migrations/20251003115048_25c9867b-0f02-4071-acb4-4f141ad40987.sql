-- Update calculate_user_streak function to include explicit search_path for security
CREATE OR REPLACE FUNCTION public.calculate_user_streak(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  -- Check if user studied today or yesterday to start counting
  IF NOT EXISTS (
    SELECT 1 FROM public.study_stats 
    WHERE user_id = user_id_param 
    AND date = CURRENT_DATE 
    AND total_study_minutes > 0
  ) THEN
    -- If no study today, check yesterday
    IF NOT EXISTS (
      SELECT 1 FROM public.study_stats 
      WHERE user_id = user_id_param 
      AND date = CURRENT_DATE - INTERVAL '1 day' 
      AND total_study_minutes > 0
    ) THEN
      RETURN 0;
    END IF;
    check_date := CURRENT_DATE - INTERVAL '1 day';
  END IF;

  -- Count consecutive days backwards
  WHILE EXISTS (
    SELECT 1 FROM public.study_stats 
    WHERE user_id = user_id_param 
    AND date = check_date 
    AND total_study_minutes > 0
  ) LOOP
    current_streak := current_streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;

  RETURN current_streak;
END;
$function$;