import { useState } from 'react';
import { StudyTimer } from '@/components/StudyTimer';
import { StudyStats } from '@/components/StudyStats';
import { StudyCalendar } from '@/components/StudyCalendar';
import { CalendarIntegrationCard } from '@/components/CalendarIntegrationCard';
import { SettingsModal } from '@/components/SettingsModal';
import { StudyEventCreator } from '@/components/StudyEventCreator';
import { useSmartReminders } from '@/hooks/useSmartReminders';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks] = useState<Task[]>([
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
    }
  ]);

  const [studyTime] = useState(125);
  const [weeklyGoal] = useState(600);
  const [streakDays] = useState(7);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [eventCreatorOpen, setEventCreatorOpen] = useState(false);

  const { toast } = useToast();

  // Initialize smart reminders
  useSmartReminders(
    tasks.map(t => ({ ...t, difficulty: t.difficulty || 3 })), 
    [],
    (sessionId, newDateTime) => {
      toast({
        title: "Sessão Reagendada",
        description: newDateTime 
          ? `Reagendada para ${new Date(newDateTime).toLocaleString('pt-BR')}`
          : "Sessão foi reagendada automaticamente",
      });
    }
  );

  const handleSessionComplete = (type: 'study' | 'break', duration: number) => {
    if (type === 'study') {
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="card-study p-6 bg-gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Olá, {user?.user_metadata?.full_name || user?.email}! 📚
            </h1>
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

      {/* Stats Section */}
      <StudyStats
        todayStudyTime={studyTime}
        weeklyGoal={weeklyGoal}
        streakDays={streakDays}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
      />

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
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <CalendarIntegrationCard onOpenSettings={() => setSettingsModalOpen(true)} />
        </div>
      </div>

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

export default Dashboard;