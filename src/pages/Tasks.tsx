import { useState } from 'react';
import { TaskList } from '@/components/TaskList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const Tasks = () => {
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
    },
    {
      id: '4',
      title: 'Exercícios de Química',
      subject: 'Química',
      dueDate: '2024-12-25',
      priority: 'low',
      completed: false,
      estimatedTime: 60,
      difficulty: 2
    }
  ]);

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

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const highPriorityTasks = pendingTasks.filter(task => task.priority === 'high');
  const overdueTasks = pendingTasks.filter(task => new Date(task.dueDate) < new Date());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Minhas Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie suas atividades acadêmicas e prazos
          </p>
        </div>
        <Button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas criadas
            </p>
          </CardContent>
        </Card>

        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Para fazer
            </p>
          </CardContent>
        </Card>

        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Tasks Alert */}
      {highPriorityTasks.length > 0 && (
        <Card className="card-study border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Tarefas de Alta Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Você tem {highPriorityTasks.length} tarefa(s) de alta prioridade que precisam de atenção:
            </p>
            <ul className="space-y-1">
              {highPriorityTasks.map((task) => (
                <li key={task.id} className="text-sm">
                  • {task.title} - {task.subject} (prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <TaskList
        tasks={tasks}
        onTaskToggle={handleTaskToggle}
        onTaskAdd={handleTaskAdd}
      />
    </div>
  );
};

export default Tasks;