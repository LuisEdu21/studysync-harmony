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
      
      // Update daily stats with the session duration
      await updateDailyStats(session.duration_minutes);
      
      return data;
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  const updateDailyStats = async (durationMinutes: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Use atomic upsert function to prevent duplicate key errors
      const { error } = await supabase
        .rpc('upsert_study_stats', {
          p_user_id: user.id,
          p_date: today,
          p_minutes: durationMinutes,
          p_sessions_increment: 1
        });

      if (error) {
        console.error('Error updating daily stats:', error);
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