import { TaskList } from '@/components/TaskList';
import { TaskCreator } from '@/components/TaskCreator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealTasks, type RealTask } from '@/hooks/useRealTasks';
import { useState } from 'react';

const Tasks = () => {
  const { toast } = useToast();
  const { tasks, addTask, toggleTask, loading } = useRealTasks();
  const [creatorOpen, setCreatorOpen] = useState(false);

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await toggleTask(taskId);
    
    toast({
      title: !task.completed ? "Tarefa concluída! 🎉" : "Tarefa reaberta",
      description: !task.completed 
        ? `Parabéns! Você concluiu "${task.title}"`
        : `"${task.title}" foi marcada como pendente`,
      duration: 3000,
    });
  };

  const handleTaskAdd = async (newTask: Omit<RealTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await addTask(newTask);
    
    toast({
      title: "Nova tarefa adicionada! ✅",
      description: `"${newTask.title}" foi adicionada à sua lista`,
      duration: 3000,
    });
  };

  // Filter tasks
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed);
  const overdueTasks = tasks.filter(task => {
    const today = new Date();
    const dueDate = new Date(task.due_date || '');
    return task.due_date && dueDate < today && !task.completed;
  });

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
        <Button className="btn-primary" onClick={() => setCreatorOpen(true)}>
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
                  {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="text-muted-foreground">Carregando tarefas...</div>
        </div>
      ) : (
        <TaskList 
          tasks={tasks}
          onTaskToggle={handleTaskToggle}
        />
      )}

      {/* Task Creator Dialog */}
      <TaskCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        onTaskCreated={handleTaskAdd}
      />
    </div>
  );
};

export default Tasks;