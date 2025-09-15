import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RealTask {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimated_time: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

export const useRealTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks((data || []) as RealTask[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Omit<RealTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        return;
      }

      setTasks(prev => [data as RealTask, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<RealTask>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      setTasks(prev => prev.map(task => task.id === taskId ? data as RealTask : task));
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    return updateTask(taskId, { completed: !task.completed });
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    refetch: fetchTasks
  };
};