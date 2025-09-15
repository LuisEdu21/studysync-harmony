import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudySession {
  id: string;
  user_id: string;
  task_id: string | null;
  subject: string | null;
  duration_minutes: number;
  session_type: 'study' | 'break';
  completed_at: string;
  created_at: string;
}

export const useStudySessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setSessions((data || []) as StudySession[]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSession = async (session: {
    task_id?: string;
    subject?: string;
    duration_minutes: number;
    session_type: 'study' | 'break';
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert([{ 
          ...session, 
          user_id: user.id,
          completed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding session:', error);
        return;
      }

      setSessions(prev => [data as StudySession, ...prev]);
      
      // Update daily stats
      await updateDailyStats();
      
      return data;
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  const updateDailyStats = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's study sessions
      const { data: todaySessions, error: sessionError } = await supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('session_type', 'study')
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lt('completed_at', `${today}T23:59:59.999Z`);

      if (sessionError) {
        console.error('Error fetching today sessions:', sessionError);
        return;
      }

      const totalMinutes = todaySessions?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0;
      const sessionsCount = todaySessions?.length || 0;

      // Calculate streak
      const { data: streakData, error: streakError } = await supabase
        .rpc('calculate_user_streak', { user_id_param: user.id });

      if (streakError) {
        console.error('Error calculating streak:', streakError);
      }

      const streak = streakData || 0;

      // Upsert daily stats
      const { error: upsertError } = await supabase
        .from('study_stats')
        .upsert({
          user_id: user.id,
          date: today,
          total_study_minutes: totalMinutes,
          sessions_count: sessionsCount,
          streak_days: streak
        });

      if (upsertError) {
        console.error('Error updating daily stats:', upsertError);
      }
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  };

  const getTodayStudyTime = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(session => 
      session.session_type === 'study' && 
      session.completed_at.startsWith(today)
    );
    return todaySessions.reduce((sum, session) => sum + session.duration_minutes, 0);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  return {
    sessions,
    loading,
    addSession,
    getTodayStudyTime,
    refetch: fetchSessions
  };
};