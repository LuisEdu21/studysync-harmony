import { useState, useEffect } from 'react';
import { StudyTimer } from '@/components/StudyTimer';
import { TaskList } from '@/components/TaskList';
import { StudyStats } from '@/components/StudyStats';
import { StudyCalendar } from '@/components/StudyCalendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Settings, Bell, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimatedTime: number;
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
      estimatedTime: 90
    },
    {
      id: '2',
      title: 'Relatório de Física',
      subject: 'Física',
      dueDate: '2024-12-22',
      priority: 'medium',
      completed: false,
      estimatedTime: 120
    },
    {
      id: '3',
      title: 'Leitura - Capítulo 5',
      subject: 'História',
      dueDate: '2024-12-18',
      priority: 'low',
      completed: true,
      estimatedTime: 45
    }
  ]);

  const [studyEvents] = useState<StudyEvent[]>([
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

  const { toast } = useToast();

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
      id: Date.now().toString()
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
              <Button size="sm" variant="ghost" className="p-2">
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
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <TaskList
              tasks={tasks}
              onTaskToggle={handleTaskToggle}
              onTaskAdd={handleTaskAdd}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
