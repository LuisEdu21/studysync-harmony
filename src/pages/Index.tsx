import { useState, useEffect } from 'react';
import { StudyTimer } from '@/components/StudyTimer';
import { TaskList } from '@/components/TaskList';
import { StudyStats } from '@/components/StudyStats';
import { StudyCalendar } from '@/components/StudyCalendar';
import { CalendarIntegrationCard } from '@/components/CalendarIntegrationCard';
import { SettingsModal } from '@/components/SettingsModal';
import { StudyEventCreator } from '@/components/StudyEventCreator';
import { StudyPlanner } from '@/components/StudyPlanner';
import { useSmartReminders } from '@/hooks/useSmartReminders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Settings, Bell, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimatedTime: number;
  difficulty?: number;
}

interface StudyEvent {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  type: 'study' | 'exam' | 'assignment';
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Estudar Cálculo I - Derivadas',
      subject: 'Matemática',
      dueDate: '2024-12-20',
      priority: 'high',
      completed: false,
      estimatedTime: 90,
      difficulty: 4
    },
    {
      id: '2',
      title: 'Relatório de Física',
      subject: 'Física',
      dueDate: '2024-12-22',
      priority: 'medium',
      completed: false,
      estimatedTime: 120,
      difficulty: 3
    },
    {
      id: '3',
      title: 'Leitura - Capítulo 5',
      subject: 'História',
      dueDate: '2024-12-18',
      priority: 'low',
      completed: true,
      estimatedTime: 45,
      difficulty: 2
    }
  ]);

  const [studyEvents, setStudyEvents] = useState<StudyEvent[]>([
    {
      id: '1',
      title: 'Prova de Cálculo',
      subject: 'Matemática',
      date: '2024-12-20',
      time: '14:00',
      duration: 120,
      type: 'exam'
    },
    {
      id: '2',
      title: 'Sessão de Estudo - Física',
      subject: 'Física',
      date: '2024-12-19',
      time: '16:00',
      duration: 90,
      type: 'study'
    },
    {
      id: '3',
      title: 'Entrega do Relatório',
      subject: 'Física',
      date: '2024-12-22',
      time: '23:59',
      duration: 0,
      type: 'assignment'
    }
  ]);

  const [studyTime, setStudyTime] = useState(125); // minutes studied today
  const [weeklyGoal] = useState(600); // 10 hours per week
  const [streakDays] = useState(7);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [eventCreatorOpen, setEventCreatorOpen] = useState(false);

  const { toast } = useToast();
  const { hasAnyCalendarEnabled } = useSettings();

  // Initialize smart reminders
  const {
    settings: reminderSettings,
    setSettings: setReminderSettings,
    activeReminders,
    permissionGranted,
    requestNotificationPermission
  } = useSmartReminders(
    tasks.map(t => ({ ...t, difficulty: t.difficulty || 3 })), 
    [],
    (sessionId, newDateTime) => {
      // Handle session rescheduling
      toast({
        title: "Sessão Reagendada",
        description: newDateTime 
          ? `Reagendada para ${new Date(newDateTime).toLocaleString('pt-BR')}`
          : "Sessão foi reagendada automaticamente",
      });
    }
  );

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      toast({
        title: "Tarefa concluída! 🎉",
        description: `"${task.title}" foi marcada como concluída.`,
        duration: 3000,
      });
    }
  };

  const handleTaskAdd = (newTask: Omit<Task, 'id'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      difficulty: newTask.difficulty || 3
    };
    setTasks(prev => [...prev, task]);
    
    toast({
      title: "Nova tarefa adicionada!",
      description: `"${task.title}" foi adicionada à sua lista.`,
      duration: 3000,
    });
  };

  const handleSessionComplete = (type: 'study' | 'break', duration: number) => {
    if (type === 'study') {
      setStudyTime(prev => prev + Math.floor(duration / 60));
      toast({
        title: "Sessão de estudo concluída! 🎯",
        description: `Você estudou por ${Math.floor(duration / 60)} minutos. Continue assim!`,
        duration: 5000,
      });
    } else {
      toast({
        title: "Pausa concluída! ☕",
        description: "Hora de voltar aos estudos com energia renovada!",
        duration: 3000,
      });
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">StudyFlow</h1>
                <p className="text-sm text-muted-foreground">Organize seus estudos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="p-2">
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2"
                onClick={() => setSettingsModalOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button size="sm" variant="ghost" className="p-2">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="card-study p-6 bg-gradient-primary text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Olá! Pronto para estudar? 📚
                </h2>
                <p className="text-white/90">
                  Você já estudou {Math.floor(studyTime / 60)}h {studyTime % 60}min hoje. Continue assim!
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{streakDays}</div>
                <div className="text-sm text-white/80">dias seguidos</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <StudyStats
            todayStudyTime={studyTime}
            weeklyGoal={weeklyGoal}
            streakDays={streakDays}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <StudyTimer onSessionComplete={handleSessionComplete} />
            <StudyCalendar 
              events={studyEvents} 
              onEventClick={(event) => {
                toast({
                  title: event.title,
                  description: `${event.subject} - ${event.time}`,
                  duration: 3000,
                });
              }}
              onCreateEvent={() => setEventCreatorOpen(true)}
            />
            <CalendarIntegrationCard onOpenSettings={() => setSettingsModalOpen(true)} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <StudyPlanner 
              tasks={tasks.map(t => ({ ...t, difficulty: t.difficulty || 3 }))}
              onTaskUpdate={(updatedTasks) => setTasks(updatedTasks)} 
            />
            <TaskList
              tasks={tasks}
              onTaskToggle={handleTaskToggle}
              onTaskAdd={handleTaskAdd}
            />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        open={settingsModalOpen} 
        onOpenChange={setSettingsModalOpen}
        tasks={tasks}
        sessions={[]}
        onRescheduleSession={(sessionId, newDateTime) => {
          toast({
            title: "Sessão Reagendada",
            description: newDateTime 
              ? `Reagendada para ${new Date(newDateTime).toLocaleString('pt-BR')}`
              : "Sessão foi reagendada automaticamente",
          });
        }}
      />

      {/* Study Event Creator */}
      <StudyEventCreator
        open={eventCreatorOpen}
        onOpenChange={setEventCreatorOpen}
        onEventCreated={(event) => {
          // Add event to local state
          const newEvent = {
            id: Date.now().toString(),
            title: event.title,
            subject: event.subject || '',
            date: event.startTime.split('T')[0],
            time: event.startTime.split('T')[1]?.substring(0, 5) || '',
            duration: Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000),
            type: 'study' as const
          };
          setStudyEvents(prev => [...prev, newEvent]);
        }}
      />
    </div>
  );
};

export default Index;
