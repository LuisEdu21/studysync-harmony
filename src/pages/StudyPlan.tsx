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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}m</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dificuldade Média</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDifficulty.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Nível de complexidade
            </p>
          </CardContent>
        </Card>

        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prioridade Alta</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas urgentes
            </p>
          </CardContent>
        </Card>

        <Card className="card-study">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Meta semanal
            </p>
          </CardContent>
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