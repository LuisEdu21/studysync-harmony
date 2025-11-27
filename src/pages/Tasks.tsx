import { TaskList } from '@/components/TaskList';
import { TaskCreator } from '@/components/TaskCreator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealTasks, type RealTask } from '@/hooks/useRealTasks';
import { useState, useMemo } from 'react';

const Tasks = () => {
  const { toast } = useToast();
  const { tasks, addTask, updateTask, deleteTask, toggleTask, loading } = useRealTasks();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RealTask | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const handleTaskUpdate = async (taskId: string, updates: Partial<RealTask>) => {
    await updateTask(taskId, updates);
    
    toast({
      title: "Tarefa atualizada! ✏️",
      description: "As alterações foram salvas com sucesso",
      duration: 3000,
    });
    setEditingTask(undefined);
  };

  const handleTaskEdit = (task: RealTask) => {
    setEditingTask(task);
    setCreatorOpen(true);
  };

  const handleTaskDelete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await deleteTask(taskId);
    
    toast({
      title: "Tarefa excluída",
      description: `"${task.title}" foi removida da sua lista`,
      duration: 3000,
    });
  };

  const handleCreatorClose = (open: boolean) => {
    setCreatorOpen(open);
    if (!open) {
      setEditingTask(undefined);
    }
  };

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const subjectSet = new Set(tasks.map(t => t.subject).filter(Boolean));
    return Array.from(subjectSet);
  }, [tasks]);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (task.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      // Subject filter
      const matchesSubject = filterSubject === 'all' || task.subject === filterSubject;
      
      // Priority filter
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'completed' && task.completed) ||
                           (filterStatus === 'pending' && !task.completed);
      
      return matchesSearch && matchesSubject && matchesPriority && matchesStatus;
    });
  }, [tasks, searchQuery, filterSubject, filterPriority, filterStatus]);

  // Statistics
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

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject!}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

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
          tasks={filteredTasks}
          onTaskToggle={handleTaskToggle}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
        />
      )}

      {/* Task Creator/Editor Dialog */}
      <TaskCreator
        open={creatorOpen}
        onOpenChange={handleCreatorClose}
        onTaskCreated={handleTaskAdd}
        editingTask={editingTask}
        onTaskUpdated={handleTaskUpdate}
      />
    </div>
  );
};

export default Tasks;