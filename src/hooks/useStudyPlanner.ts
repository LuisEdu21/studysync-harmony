import { useState, useCallback, useEffect } from 'react';
import { useCalendarIntegration } from './useCalendarIntegration';
import { useToast } from './use-toast';

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  difficulty: number; // 1-5
  estimatedTime: number; // in minutes
  completed: boolean;
  startDate?: string;
  originalDueDate?: string;
}

export interface StudySession {
  id: string;
  taskId: string;
  date: string;
  startTime: string;
  duration: number;
  completed: boolean;
  subject: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
}

export interface WeeklyPlan {
  weekStart: string;
  sessions: StudySession[];
  totalHours: number;
  coverage: { [subject: string]: number };
}

export const useStudyPlanner = (tasks: StudyTask[]) => {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { getImportedEvents } = useCalendarIntegration();
  const { toast } = useToast();

  // Calculate priority weight (higher number = more urgent)
  const getPriorityWeight = (priority: string): number => {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  };

  // Calculate urgency based on days until due date
  const getUrgencyWeight = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 0) return 5; // Overdue
    if (daysUntilDue <= 1) return 4; // Due tomorrow
    if (daysUntilDue <= 3) return 3; // Due in 3 days
    if (daysUntilDue <= 7) return 2; // Due in a week
    return 1; // More than a week
  };

  // Calculate study score for task prioritization
  const calculateStudyScore = (task: StudyTask): number => {
    const priorityWeight = getPriorityWeight(task.priority);
    const urgencyWeight = getUrgencyWeight(task.dueDate);
    const difficultyWeight = task.difficulty || 3;
    
    // Higher score = more important to study
    return (priorityWeight * 2) + (urgencyWeight * 3) + (difficultyWeight * 1.5);
  };

  // Generate time slots for the week (Monday to Sunday, 8h-22h)
  const generateTimeSlots = (weekStart: Date): { date: string; time: string }[] => {
    const slots: { date: string; time: string }[] = [];
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Generate 2-hour study blocks from 8h to 22h
      for (let hour = 8; hour < 22; hour += 2) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        slots.push({ date: dateStr, time: timeStr });
      }
    }
    
    return slots;
  };

  // Check if a time slot conflicts with existing events
  const hasConflict = async (date: string, startTime: string, duration: number): Promise<boolean> => {
    try {
      const importedEvents = await getImportedEvents();
      const slotStart = new Date(`${date}T${startTime}`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      
      return importedEvents.some(event => {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        
        // Check for overlap
        return (slotStart < eventEnd && slotEnd > eventStart);
      });
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return false;
    }
  };

  // Distribute study time across subjects based on priority and difficulty
  const distributeStudyTime = (tasks: StudyTask[], totalMinutes: number): { [subject: string]: number } => {
    const subjectScores: { [subject: string]: number } = {};
    const subjectTasks: { [subject: string]: StudyTask[] } = {};
    
    // Group tasks by subject and calculate total scores
    tasks.forEach(task => {
      if (!task.completed) {
        const score = calculateStudyScore(task);
        subjectScores[task.subject] = (subjectScores[task.subject] || 0) + score;
        subjectTasks[task.subject] = subjectTasks[task.subject] || [];
        subjectTasks[task.subject].push(task);
      }
    });
    
    const totalScore = Object.values(subjectScores).reduce((sum, score) => sum + score, 0);
    const distribution: { [subject: string]: number } = {};
    
    Object.keys(subjectScores).forEach(subject => {
      const proportion = subjectScores[subject] / totalScore;
      distribution[subject] = Math.round(totalMinutes * proportion);
    });
    
    return distribution;
  };

  // Generate weekly study plan
  const generateWeeklyPlan = useCallback(async (): Promise<WeeklyPlan> => {
    setIsGenerating(true);
    
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const weekStartStr = startOfWeek.toISOString().split('T')[0];
      const timeSlots = generateTimeSlots(startOfWeek);
      const incompleteTasks = tasks.filter(task => !task.completed);
      
      if (incompleteTasks.length === 0) {
        return {
          weekStart: weekStartStr,
          sessions: [],
          totalHours: 0,
          coverage: {}
        };
      }
      
      // Calculate total available study time (assuming 6 hours max per day)
      const maxStudyMinutesPerWeek = 6 * 60 * 7; // 42 hours max
      const timeDistribution = distributeStudyTime(incompleteTasks, maxStudyMinutesPerWeek);
      
      const sessions: StudySession[] = [];
      const subjectTimeUsed: { [subject: string]: number } = {};
      
      // Sort tasks by study score (highest first)
      const sortedTasks = [...incompleteTasks].sort((a, b) => 
        calculateStudyScore(b) - calculateStudyScore(a)
      );
      
      // Assign study sessions
      for (const slot of timeSlots) {
        const hasConflictResult = await hasConflict(slot.date, slot.time, 120);
        if (hasConflictResult) continue;
        
        // Find the most urgent task that needs more study time
        const taskToStudy = sortedTasks.find(task => {
          const timeNeeded = timeDistribution[task.subject] || 0;
          const timeUsed = subjectTimeUsed[task.subject] || 0;
          return timeUsed < timeNeeded && timeUsed < task.estimatedTime;
        });
        
        if (!taskToStudy) continue;
        
        const timeNeeded = Math.min(
          120, // 2-hour blocks
          (timeDistribution[taskToStudy.subject] || 0) - (subjectTimeUsed[taskToStudy.subject] || 0),
          taskToStudy.estimatedTime - (subjectTimeUsed[taskToStudy.subject] || 0)
        );
        
        if (timeNeeded >= 30) { // Minimum 30-minute sessions
          const session: StudySession = {
            id: `${taskToStudy.id}-${slot.date}-${slot.time}`,
            taskId: taskToStudy.id,
            date: slot.date,
            startTime: slot.time,
            duration: timeNeeded,
            completed: false,
            subject: taskToStudy.subject,
            title: taskToStudy.title,
            priority: taskToStudy.priority
          };
          
          sessions.push(session);
          subjectTimeUsed[taskToStudy.subject] = (subjectTimeUsed[taskToStudy.subject] || 0) + timeNeeded;
        }
      }
      
      const totalHours = sessions.reduce((sum, session) => sum + session.duration, 0) / 60;
      const coverage = Object.keys(timeDistribution).reduce((acc, subject) => {
        const allocated = subjectTimeUsed[subject] || 0;
        const needed = timeDistribution[subject] || 0;
        acc[subject] = needed > 0 ? Math.min(100, (allocated / needed) * 100) : 100;
        return acc;
      }, {} as { [subject: string]: number });
      
      return {
        weekStart: weekStartStr,
        sessions,
        totalHours,
        coverage
      };
    } catch (error) {
      console.error('Error generating study plan:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [tasks, getImportedEvents]);

  // Adjust plan when task is not completed
  const adjustPlanForMissedTask = useCallback(async (sessionId: string, newDate?: string) => {
    if (!weeklyPlan) return;
    
    const missedSession = weeklyPlan.sessions.find(s => s.id === sessionId);
    if (!missedSession) return;
    
    const updatedSessions = weeklyPlan.sessions.map(session => {
      if (session.id === sessionId) {
        if (newDate) {
          // Reschedule to new date
          return { ...session, date: newDate, completed: false };
        } else {
          // Mark as missed and redistribute time
          return { ...session, completed: false };
        }
      }
      return session;
    });
    
    // If no new date provided, try to find next available slot
    if (!newDate && missedSession) {
      const now = new Date();
      const timeSlots = generateTimeSlots(now);
      
      for (const slot of timeSlots) {
        const slotDate = new Date(slot.date);
        if (slotDate > now && !(await hasConflict(slot.date, slot.time, missedSession.duration))) {
          const rescheduleSession: StudySession = {
            ...missedSession,
            id: `${missedSession.taskId}-rescheduled-${slot.date}-${slot.time}`,
            date: slot.date,
            startTime: slot.time
          };
          updatedSessions.push(rescheduleSession);
          break;
        }
      }
    }
    
    setWeeklyPlan(prev => prev ? { ...prev, sessions: updatedSessions } : null);
    
    toast({
      title: "Plano Ajustado",
      description: newDate 
        ? `Sessão reagendada para ${new Date(newDate).toLocaleDateString('pt-BR')}`
        : "Plano foi ajustado automaticamente",
    });
  }, [weeklyPlan, toast, hasConflict]);

  // Mark session as completed
  const completeSession = useCallback((sessionId: string) => {
    if (!weeklyPlan) return;
    
    const updatedSessions = weeklyPlan.sessions.map(session =>
      session.id === sessionId ? { ...session, completed: true } : session
    );
    
    setWeeklyPlan(prev => prev ? { ...prev, sessions: updatedSessions } : null);
    
    toast({
      title: "Sessão Concluída! 🎉",
      description: "Parabéns! Continue assim!",
    });
  }, [weeklyPlan, toast]);

  // Auto-generate plan when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      generateWeeklyPlan().then(setWeeklyPlan).catch(console.error);
    }
  }, [tasks, generateWeeklyPlan]);

  return {
    weeklyPlan,
    isGenerating,
    generateWeeklyPlan: () => generateWeeklyPlan().then(setWeeklyPlan),
    adjustPlanForMissedTask,
    completeSession,
  };
};