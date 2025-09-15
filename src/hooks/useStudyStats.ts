import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudyStats {
  id: string;
  user_id: string;
  date: string;
  total_study_minutes: number;
  sessions_count: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export const useStudyStats = () => {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('study_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today stats:', error);
        return;
      }

      // If no stats for today, create initial record
      if (!data) {
        const { data: newStats, error: insertError } = await supabase
          .from('study_stats')
          .insert({
            user_id: user.id,
            date: today,
            total_study_minutes: 0,
            sessions_count: 0,
            streak_days: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating today stats:', insertError);
          return;
        }

        setTodayStats(newStats);
      } else {
        setTodayStats(data);
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyStats = async () => {
    if (!user) return [];

    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('study_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching weekly stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return [];
    }
  };

  const getTotalWeeklyTime = async () => {
    const weeklyStats = await getWeeklyStats();
    return weeklyStats.reduce((sum, stat) => sum + stat.total_study_minutes, 0);
  };

  useEffect(() => {
    fetchTodayStats();
  }, [user]);

  return {
    todayStats,
    loading,
    getWeeklyStats,
    getTotalWeeklyTime,
    refetch: fetchTodayStats
  };
};