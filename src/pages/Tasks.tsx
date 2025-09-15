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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">{tasks.length}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tarefas criadas</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-semibold text-success">{completedTasks.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tarefas finalizadas</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-semibold text-warning">{pendingTasks.length}</p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Para fazer</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Atrasadas</p>
              <p className="text-2xl font-semibold text-destructive">{overdueTasks.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Vencidas</p>
        </Card>
      </div>

      {/* High Priority Tasks Alert */}
      {highPriorityTasks.length > 0 && (
        <Card className="p-4 border-warning/20 bg-warning/5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-medium text-warning">Tarefas de Alta Prioridade</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Você tem {highPriorityTasks.length} tarefa(s) de alta prioridade que precisam de atenção:
          </p>
          <div className="space-y-2">
            {highPriorityTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-warning/10 rounded text-sm">
                <span>{task.title} - {task.subject}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
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