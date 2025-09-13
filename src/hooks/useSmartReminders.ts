import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import type { StudyTask, StudySession } from './useStudyPlanner';

interface ReminderSettings {
  enabled: boolean;
  soundEnabled: boolean;
  urgencyMultiplier: number; // How much more frequent for urgent tasks
  minReminderInterval: number; // Minutes
  maxReminderInterval: number; // Minutes
  autoReschedule: boolean;
  rescheduleDelay: number; // Minutes to wait before rescheduling
}

interface ActiveReminder {
  id: string;
  taskId: string;
  sessionId?: string;
  type: 'task_due' | 'session_start' | 'session_overdue';
  scheduledTime: Date;
  urgencyLevel: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
  retryCount: number;
  lastShown?: Date;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  soundEnabled: true,
  urgencyMultiplier: 2,
  minReminderInterval: 15,
  maxReminderInterval: 240,
  autoReschedule: true,
  rescheduleDelay: 30
};

export const useSmartReminders = (
  tasks: StudyTask[],
  sessions: StudySession[],
  onRescheduleSession?: (sessionId: string, newDateTime?: string) => void
) => {
  const [settings, setSettings] = useState<ReminderSettings>(() => {
    const saved = localStorage.getItem('reminder-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const [activeReminders, setActiveReminders] = useState<ActiveReminder[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const { toast } = useToast();

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }, []);

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('reminder-settings', JSON.stringify(settings));
  }, [settings]);

  // Calculate urgency level based on due date and priority
  const calculateUrgencyLevel = useCallback((task: StudyTask): 1 | 2 | 3 | 4 | 5 => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let urgency = 1;
    
    // Base urgency on time remaining
    if (hoursUntilDue <= 0) urgency = 5; // Overdue
    else if (hoursUntilDue <= 6) urgency = 4; // Due within 6 hours
    else if (hoursUntilDue <= 24) urgency = 3; // Due within 24 hours
    else if (hoursUntilDue <= 72) urgency = 2; // Due within 3 days
    else urgency = 1; // More than 3 days
    
    // Adjust for priority
    if (task.priority === 'high') urgency = Math.min(5, urgency + 1);
    else if (task.priority === 'low') urgency = Math.max(1, urgency - 1);
    
    // Adjust for difficulty
    if (task.difficulty && task.difficulty >= 4) urgency = Math.min(5, urgency + 1);
    
    return urgency as 1 | 2 | 3 | 4 | 5;
  }, []);

  // Calculate reminder interval based on urgency
  const calculateReminderInterval = useCallback((urgencyLevel: number): number => {
    const baseInterval = settings.maxReminderInterval - 
      ((urgencyLevel - 1) / 4) * (settings.maxReminderInterval - settings.minReminderInterval);
    
    return Math.max(settings.minReminderInterval, Math.round(baseInterval));
  }, [settings]);

  // Show notification
  const showNotification = useCallback((reminder: ActiveReminder, task?: StudyTask, session?: StudySession) => {
    if (!settings.enabled || !permissionGranted) return;

    const taskData = task || tasks.find(t => t.id === reminder.taskId);
    const sessionData = session || sessions.find(s => s.id === reminder.sessionId);
    
    if (!taskData) return;

    let title = '';
    let body = '';
    let icon = '📚';

    switch (reminder.type) {
      case 'task_due':
        title = `⏰ Tarefa Vencendo: ${taskData.title}`;
        body = `Matéria: ${taskData.subject}\nVence em: ${new Date(taskData.dueDate).toLocaleString('pt-BR')}`;
        if (reminder.urgencyLevel >= 4) icon = '🚨';
        else if (reminder.urgencyLevel >= 3) icon = '⚠️';
        break;
      
      case 'session_start':
        title = `🎯 Hora de Estudar: ${sessionData?.title || taskData.title}`;
        body = `Matéria: ${sessionData?.subject || taskData.subject}\nDuração: ${sessionData?.duration || 60} minutos`;
        break;
      
      case 'session_overdue':
        title = `📍 Sessão Perdida: ${sessionData?.title || taskData.title}`;
        body = `A sessão de estudo não foi iniciada. Reagendar automaticamente?`;
        icon = '⏳';
        break;
    }

    // Browser notification
    const notification = new Notification(title, {
      body,
      icon: `/favicon.ico`,
      badge: `/favicon.ico`,
      tag: reminder.id,
      requireInteraction: reminder.urgencyLevel >= 3,
      silent: !settings.soundEnabled
    });

    // Auto-close after delay based on urgency
    const autoCloseDelay = reminder.urgencyLevel >= 4 ? 15000 : 
                          reminder.urgencyLevel >= 3 ? 10000 : 5000;
    
    setTimeout(() => {
      notification.close();
    }, autoCloseDelay);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Show in-app toast
      toast({
        title: title.replace(/^[^\s]+\s/, ''), // Remove emoji
        description: body.replace(/\n/g, ' • '),
        duration: 8000,
      });
    };

    // Update last shown time
    setActiveReminders(prev => prev.map(r => 
      r.id === reminder.id ? { ...r, lastShown: new Date() } : r
    ));

  }, [settings, permissionGranted, tasks, sessions, toast]);

  // Schedule auto-reschedule for ignored reminders
  const scheduleAutoReschedule = useCallback((reminder: ActiveReminder) => {
    if (!settings.autoReschedule || !onRescheduleSession || !reminder.sessionId) return;

    const rescheduleTimeout = setTimeout(() => {
      // Find next available time slot (simplified logic)
      const now = new Date();
      const nextSlot = new Date(now.getTime() + settings.rescheduleDelay * 60000);
      
      // Round to next 30-minute mark
      nextSlot.setMinutes(Math.ceil(nextSlot.getMinutes() / 30) * 30, 0, 0);
      
      const newDateTime = nextSlot.toISOString();
      onRescheduleSession(reminder.sessionId!, newDateTime);
      
      toast({
        title: "Sessão Reagendada Automaticamente",
        description: `Reagendada para ${nextSlot.toLocaleString('pt-BR')}`,
        duration: 5000,
      });

      // Remove the reminder
      setActiveReminders(prev => prev.filter(r => r.id !== reminder.id));
      delete timeoutRefs.current[reminder.id];
      
    }, settings.rescheduleDelay * 60000);

    timeoutRefs.current[`reschedule-${reminder.id}`] = rescheduleTimeout;
  }, [settings, onRescheduleSession, toast]);

  // Process and schedule reminders for tasks
  const scheduleTaskReminders = useCallback(() => {
    if (!settings.enabled) return;

    const now = new Date();
    const newReminders: ActiveReminder[] = [];

    tasks.forEach(task => {
      if (task.completed) return;

      const urgencyLevel = calculateUrgencyLevel(task);
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Only schedule reminders for tasks due within 7 days
      if (hoursUntilDue > 168) return;

      const reminderInterval = calculateReminderInterval(urgencyLevel);
      const existingReminder = activeReminders.find(r => 
        r.taskId === task.id && r.type === 'task_due'
      );

      // Skip if reminder was shown recently
      if (existingReminder?.lastShown) {
        const minutesSinceShown = (now.getTime() - existingReminder.lastShown.getTime()) / (1000 * 60);
        if (minutesSinceShown < reminderInterval) return;
      }

      const reminder: ActiveReminder = {
        id: `task-${task.id}-${now.getTime()}`,
        taskId: task.id,
        type: 'task_due',
        scheduledTime: new Date(now.getTime() + reminderInterval * 60000),
        urgencyLevel,
        retryCount: existingReminder ? existingReminder.retryCount + 1 : 0
      };

      newReminders.push(reminder);

      // Schedule the notification
      const timeout = setTimeout(() => {
        showNotification(reminder, task);
        
        // Schedule next reminder if task is still incomplete
        setTimeout(() => {
          scheduleTaskReminders();
        }, 1000);
        
      }, reminderInterval * 60000);

      timeoutRefs.current[reminder.id] = timeout;
    });

    setActiveReminders(prev => {
      // Remove old task reminders and add new ones
      const filtered = prev.filter(r => r.type !== 'task_due');
      return [...filtered, ...newReminders];
    });
  }, [settings, tasks, activeReminders, calculateUrgencyLevel, calculateReminderInterval, showNotification]);

  // Schedule session reminders
  const scheduleSessionReminders = useCallback(() => {
    if (!settings.enabled) return;

    const now = new Date();
    const newReminders: ActiveReminder[] = [];

    sessions.forEach(session => {
      if (session.completed) return;

      const sessionStart = new Date(`${session.date}T${session.startTime}`);
      const minutesUntilStart = (sessionStart.getTime() - now.getTime()) / (1000 * 60);

      // Schedule reminder 15 minutes before session
      if (minutesUntilStart > 15 && minutesUntilStart <= 1440) { // Within 24 hours
        const reminderTime = new Date(sessionStart.getTime() - 15 * 60000);
        
        const reminder: ActiveReminder = {
          id: `session-start-${session.id}`,
          taskId: session.taskId,
          sessionId: session.id,
          type: 'session_start',
          scheduledTime: reminderTime,
          urgencyLevel: 2,
          retryCount: 0
        };

        newReminders.push(reminder);

        const timeout = setTimeout(() => {
          showNotification(reminder);
        }, reminderTime.getTime() - now.getTime());

        timeoutRefs.current[reminder.id] = timeout;
      }

      // Check for overdue sessions
      if (minutesUntilStart < -30) { // 30 minutes overdue
        const reminder: ActiveReminder = {
          id: `session-overdue-${session.id}`,
          taskId: session.taskId,
          sessionId: session.id,
          type: 'session_overdue',
          scheduledTime: now,
          urgencyLevel: 3,
          retryCount: 0
        };

        newReminders.push(reminder);
        showNotification(reminder);
        scheduleAutoReschedule(reminder);
      }
    });

    setActiveReminders(prev => {
      const filtered = prev.filter(r => r.type === 'task_due');
      return [...filtered, ...newReminders];
    });
  }, [settings, sessions, showNotification, scheduleAutoReschedule]);

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    timeoutRefs.current = {};
  }, []);

  // Update reminders when tasks or sessions change
  useEffect(() => {
    clearAllTimeouts();
    
    if (settings.enabled && permissionGranted) {
      scheduleTaskReminders();
      scheduleSessionReminders();
    }

    return clearAllTimeouts;
  }, [tasks, sessions, settings.enabled, permissionGranted, scheduleTaskReminders, scheduleSessionReminders, clearAllTimeouts]);

  // Dismiss reminder manually
  const dismissReminder = useCallback((reminderId: string) => {
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
    
    if (timeoutRefs.current[reminderId]) {
      clearTimeout(timeoutRefs.current[reminderId]);
      delete timeoutRefs.current[reminderId];
    }
  }, []);

  // Snooze reminder
  const snoozeReminder = useCallback((reminderId: string, minutes: number = 15) => {
    const reminder = activeReminders.find(r => r.id === reminderId);
    if (!reminder) return;

    // Clear current timeout
    if (timeoutRefs.current[reminderId]) {
      clearTimeout(timeoutRefs.current[reminderId]);
    }

    // Schedule new timeout
    const timeout = setTimeout(() => {
      showNotification(reminder);
    }, minutes * 60000);

    timeoutRefs.current[reminderId] = timeout;

    toast({
      title: "Lembrete Adiado",
      description: `Lembrete adiado por ${minutes} minutos`,
      duration: 3000,
    });
  }, [activeReminders, showNotification, toast]);

  return {
    settings,
    setSettings,
    activeReminders,
    permissionGranted,
    requestNotificationPermission,
    dismissReminder,
    snoozeReminder,
    scheduleTaskReminders,
    scheduleSessionReminders
  };
};