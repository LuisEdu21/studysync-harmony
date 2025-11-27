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
  const [weeklyTotal, setWeeklyTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchTodayStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Use upsert to avoid duplicate key errors
      const { data, error } = await supabase
        .from('study_stats')
        .upsert({
          user_id: user.id,
          date: today,
          total_study_minutes: 0,
          sessions_count: 0,
          streak_days: 0
        }, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error fetching today stats:', error);
        return;
      }

      setTodayStats(data);
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
    
    // Fetch weekly total
    const fetchWeeklyTotal = async () => {
      const total = await getTotalWeeklyTime();
      setWeeklyTotal(total);
    };
    
    fetchWeeklyTotal();
  }, [user]);

  return {
    todayStats,
    weeklyTotal,
    loading,
    getWeeklyStats,
    getTotalWeeklyTime,
    refetch: fetchTodayStats
  };
};