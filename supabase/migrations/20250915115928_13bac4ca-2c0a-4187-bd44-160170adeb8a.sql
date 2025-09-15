-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  weekly_goal_minutes INTEGER DEFAULT 600,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT false,
  estimated_time INTEGER DEFAULT 60, -- in minutes
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  subject TEXT,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT DEFAULT 'study' CHECK (session_type IN ('study', 'break')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study stats table for daily tracking
CREATE TABLE public.study_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_minutes INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can manage their own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for study sessions
CREATE POLICY "Users can manage their own study sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for study stats
CREATE POLICY "Users can manage their own study stats" ON public.study_stats
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update streak calculation
CREATE OR REPLACE FUNCTION public.calculate_user_streak(user_id_param UUID)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updating updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_stats_updated_at
  BEFORE UPDATE ON public.study_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();