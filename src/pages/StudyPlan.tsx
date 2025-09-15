import { useState } from 'react';
import { StudyPlanner } from '@/components/StudyPlanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Clock, TrendingUp } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimatedTime: number;
  difficulty: number;
}

const StudyPlan = () => {
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
      title: 'Exercícios de Química',
      subject: 'Química',
      dueDate: '2024-12-25',
      priority: 'low',
      completed: false,
      estimatedTime: 60,
      difficulty: 2
    }
  ]);

  const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  const averageDifficulty = tasks.reduce((sum, task) => sum + task.difficulty, 0) / tasks.length;
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Plano de Estudo Semanal</h1>
        <p className="text-muted-foreground">
          Rotina personalizada baseada em suas tarefas e prazos
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo Total</p>
              <p className="text-2xl font-semibold">{Math.floor(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}m</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Esta semana</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dificuldade Média</p>
              <p className="text-2xl font-semibold">{averageDifficulty.toFixed(1)}/5</p>
            </div>
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Nível de complexidade</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prioridade Alta</p>
              <p className="text-2xl font-semibold">{highPriorityTasks}</p>
            </div>
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tarefas urgentes</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progresso</p>
              <p className="text-2xl font-semibold">85%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Meta semanal</p>
        </Card>
      </div>

      {/* Study Planner */}
      <StudyPlanner 
        tasks={tasks}
        onTaskUpdate={setTasks}
      />
    </div>
  );
};

export default StudyPlan;