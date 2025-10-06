import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, Award, TrendingUp } from 'lucide-react';

interface StudyStatsProps {
  todayStudyTime: number; // in minutes
  weeklyGoal: number; // in minutes
  weeklyTotal: number; // in minutes
  streakDays: number;
  completedTasks: number;
  totalTasks: number;
}

export const StudyStats = ({ 
  todayStudyTime, 
  weeklyGoal,
  weeklyTotal,
  streakDays, 
  completedTasks, 
  totalTasks 
}: StudyStatsProps) => {
  const formatTime = (minutes: number) => {
    const roundedMinutes = Math.round(minutes);
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const weeklyProgress = Math.min((todayStudyTime / weeklyGoal) * 100, 100);
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {/* Today's Study Time */}
      <Card className="card-study p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-focus-light rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-focus" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estudo Hoje</p>
            <p className="text-xl font-bold text-focus">{formatTime(todayStudyTime)}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Meta diária</span>
            <span>{formatTime(weeklyGoal / 7)}</span>
          </div>
          <Progress value={weeklyProgress} className="h-2" />
        </div>
      </Card>

      {/* Study Streak */}
      <Card className="card-study p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-energy-light rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-energy" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sequência</p>
            <p className="text-xl font-bold text-energy">{streakDays} dias</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {streakDays > 0 
            ? `Parabéns! Continue assim!` 
            : 'Comece sua sequência hoje!'
          }
        </p>
      </Card>

      {/* Task Progress */}
      <Card className="card-study p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-progress-light rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-progress" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tarefas Hoje</p>
            <p className="text-xl font-bold text-progress">
              {completedTasks}/{totalTasks}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Progress value={taskProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {taskProgress === 100 
              ? 'Todas as tarefas concluídas!' 
              : `${Math.round(taskProgress)}% concluído`
            }
          </p>
        </div>
      </Card>

      {/* Weekly Goal */}
      <Card className="card-study p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-accent-light rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Meta Semanal</p>
            <p className="text-xl font-bold text-accent">{formatTime(weeklyGoal)}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{formatTime(weeklyTotal)}</span>
          </div>
          <Progress value={Math.min((weeklyTotal / weeklyGoal) * 100, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {weeklyTotal >= weeklyGoal 
              ? '🎉 Meta atingida!' 
              : `Faltam ${formatTime(Math.max(0, weeklyGoal - weeklyTotal))} esta semana`
            }
          </p>
        </div>
      </Card>
    </div>
  );
};