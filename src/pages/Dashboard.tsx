import { useState } from 'react';
import { StudyTimer } from '@/components/StudyTimer';
import { StudyStats } from '@/components/StudyStats';
import { StudyCalendar } from '@/components/StudyCalendar';
import { CalendarIntegrationCard } from '@/components/CalendarIntegrationCard';
import { SettingsModal } from '@/components/SettingsModal';
import { StudyEventCreator } from '@/components/StudyEventCreator';
import QuickAccessCard from '@/components/QuickAccessCard';
import { useSmartReminders } from '@/hooks/useSmartReminders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Brain, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRealTasks } from '@/hooks/useRealTasks';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useStudyStats } from '@/hooks/useStudyStats';

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
  const { profile } = useUserProfile();
  const { tasks } = useRealTasks();
  const { addSession } = useStudySessions();
  const { todayStats } = useStudyStats();

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

  // Get real data from hooks
  const studyTime = todayStats?.total_study_minutes || 0;
  const weeklyGoal = profile?.weekly_goal_minutes || 600;
  const streakDays = todayStats?.streak_days || 0;
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [eventCreatorOpen, setEventCreatorOpen] = useState(false);

  const { toast } = useToast();

  // Initialize smart reminders
  useSmartReminders(
    tasks.map(t => ({ 
      ...t, 
      dueDate: t.due_date || '',
      estimatedTime: t.estimated_time || 60,
      difficulty: typeof t.difficulty === 'string' ? 
        (t.difficulty === 'easy' ? 1 : t.difficulty === 'medium' ? 3 : 5) : 
        (t.difficulty || 3)
    })), 
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

  const handleSessionComplete = async (type: 'study' | 'break', duration: number) => {
    // Save session to database
    await addSession({
      duration_minutes: duration,
      session_type: type,
      subject: type === 'study' ? 'Sessão Geral' : undefined
    });

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
      <Card className="p-6 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              Olá, {profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}! 
            </h1>
            <p className="text-primary-foreground/90">
              Você já estudou {Math.floor(studyTime / 60)}h {studyTime % 60}min hoje. Continue assim!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold">{streakDays}</div>
            <div className="text-sm text-primary-foreground/80">dias seguidos</div>
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

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickAccessCard
          title="Tarefas"
          description="Gerencie suas atividades"
          icon={CheckSquare}
          href="/tasks"
          count={totalTasks}
          countLabel={`${completedTasks} concluídas`}
          variant={totalTasks > 0 ? "primary" : "default"}
        >
          {tasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Próximas tarefas:</div>
              {tasks.slice(0, 2).map((task) => (
                <div key={task.id} className="text-sm flex items-center justify-between">
                  <span className="truncate">{task.title}</span>
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </QuickAccessCard>

        <QuickAccessCard
          title="Plano de Estudo"
          description="Organize sua semana"
          icon={Brain}
          href="/study-plan"
          variant="success"
        >
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Esta semana:</div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Meta de estudo:</span>
                <span className="font-medium">{Math.floor(weeklyGoal / 60)}h</span>
              </div>
              <div className="flex justify-between">
                <span>Progresso:</span>
                <span className="font-medium">{Math.floor(studyTime / 60)}h</span>
              </div>
            </div>
          </div>
        </QuickAccessCard>

        <QuickAccessCard
          title="Calendário"
          description="Visualize sua agenda"
          icon={Calendar}
          href="/calendar"
          count={studyEvents.length}
          countLabel="eventos hoje"
          variant="warning"
        >
          {studyEvents.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Próximos eventos:</div>
              {studyEvents.slice(0, 2).map((event) => (
                <div key={event.id} className="text-sm flex items-center justify-between">
                  <span className="truncate">{event.title}</span>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
              ))}
            </div>
          )}
        </QuickAccessCard>
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