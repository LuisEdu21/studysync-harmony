import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { type RealTask } from '@/hooks/useRealTasks';

interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimatedTime: number; // in minutes
}

interface TaskListProps {
  tasks: RealTask[];
  onTaskToggle: (taskId: string) => void;
}

export const TaskList = ({ tasks, onTaskToggle }: TaskListProps) => {

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <Card className="card-study p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-focus" />
          Tarefas
        </h3>
      </div>

      <div className="space-y-4">
        {pendingTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Pendentes ({pendingTasks.length})
            </h4>
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors animate-slide-up"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onTaskToggle(task.id)}
                    className="data-[state=checked]:bg-progress data-[state=checked]:border-progress"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {task.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimated_time}min
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                      </span>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority === 'high' ? 'Alta' : 
                     task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Concluídas ({completedTasks.length})
            </h4>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 opacity-75"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onTaskToggle(task.id)}
                    className="data-[state=checked]:bg-progress data-[state=checked]:border-progress"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate line-through text-muted-foreground">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{task.subject}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa ainda</p>
            <p className="text-sm">Adicione sua primeira tarefa!</p>
          </div>
        )}
      </div>
    </Card>
  );
};