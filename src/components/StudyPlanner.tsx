import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Target
} from 'lucide-react';
import { useStudyPlanner, type StudyTask } from '@/hooks/useStudyPlanner';

interface StudyPlannerProps {
  tasks: StudyTask[];
  onTaskUpdate?: (tasks: StudyTask[]) => void;
}

export const StudyPlanner = ({ tasks, onTaskUpdate }: StudyPlannerProps) => {
  const { 
    weeklyPlan, 
    isGenerating, 
    generateWeeklyPlan,
    adjustPlanForMissedTask,
    completeSession 
  } = useStudyPlanner(tasks);
  
  const [selectedDate, setSelectedDate] = useState<string>('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getSessionsForDate = (date: string) => {
    return weeklyPlan?.sessions.filter(session => session.date === date) || [];
  };

  const getWeekDates = () => {
    if (!weeklyPlan) return [];
    
    const weekStart = new Date(weeklyPlan.weekStart);
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const getSubjectStats = () => {
    if (!weeklyPlan) return [];
    
    return Object.entries(weeklyPlan.coverage).map(([subject, coverage]) => {
      const subjectSessions = weeklyPlan.sessions.filter(s => s.subject === subject);
      const totalTime = subjectSessions.reduce((sum, s) => sum + s.duration, 0);
      const completedTime = subjectSessions
        .filter(s => s.completed)
        .reduce((sum, s) => sum + s.duration, 0);
      
      return {
        subject,
        coverage: Math.round(coverage),
        totalTime: Math.round(totalTime / 60 * 10) / 10, // Hours with 1 decimal
        completedTime: Math.round(completedTime / 60 * 10) / 10,
        completionRate: totalTime > 0 ? Math.round((completedTime / totalTime) * 100) : 0
      };
    });
  };

  if (!weeklyPlan && !isGenerating) {
    return (
      <Card className="card-study p-6 animate-fade-in">
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Plano de Estudo Inteligente</h3>
          <p className="text-muted-foreground mb-4">
            Gere um plano personalizado baseado nos seus prazos e prioridades
          </p>
          <Button onClick={generateWeeklyPlan} className="btn-primary">
            <TrendingUp className="w-4 h-4 mr-2" />
            Gerar Plano
          </Button>
        </div>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className="card-study p-6 animate-fade-in">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-focus" />
          <h3 className="text-lg font-semibold mb-2">Gerando Plano...</h3>
          <p className="text-muted-foreground">
            Analisando seus prazos e criando o plano otimizado
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-study p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-focus" />
          Plano de Estudo Semanal
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {weeklyPlan?.totalHours.toFixed(1)}h planejadas
          </Badge>
          <Button 
            onClick={generateWeeklyPlan} 
            size="sm" 
            variant="outline"
            disabled={isGenerating}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Regenerar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {getWeekDates().map((date) => {
              const sessions = getSessionsForDate(date);
              const isToday = date === new Date().toISOString().split('T')[0];
              const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
              
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(selectedDate === date ? '' : date)}
                  className={`p-3 rounded-lg border text-center transition-all hover:bg-muted/50 ${
                    selectedDate === date ? 'ring-2 ring-focus' : ''
                  } ${isToday ? 'bg-focus/10 border-focus' : 'border-border'}`}
                >
                  <div className="text-xs font-medium mb-1">
                    {formatDate(date)}
                  </div>
                  <div className="text-sm font-semibold">
                    {sessions.length > 0 ? `${Math.round(totalTime / 60)}h` : '-'}
                  </div>
                  <div className="flex justify-center mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      sessions.length > 0 ? 'bg-focus' : 'bg-muted'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="font-medium text-sm text-muted-foreground">
                Sessões para {formatDate(selectedDate)}
              </h4>
              {getSessionsForDate(selectedDate).map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border transition-all ${
                    session.completed ? 'bg-muted/30 opacity-75' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{session.title}</span>
                        <Badge className={getPriorityColor(session.priority)}>
                          {session.priority === 'high' ? 'Alta' : 
                           session.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(session.startTime)} ({session.duration}min)
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {session.subject}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.completed ? (
                        <CheckCircle className="w-5 h-5 text-progress" />
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => completeSession(session.id)}
                            className="h-7 px-2"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustPlanForMissedTask(session.id)}
                            className="h-7 px-2"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {weeklyPlan?.sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border transition-all ${
                  session.completed ? 'bg-muted/30 opacity-75' : 'bg-background hover:bg-muted/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{session.title}</h4>
                      <Badge className={getPriorityColor(session.priority)}>
                        {session.priority === 'high' ? 'Alta' : 
                         session.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.startTime)} ({session.duration}min)
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {session.subject}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.completed ? (
                      <div className="flex items-center gap-1 text-progress">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Concluído</span>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => completeSession(session.id)}
                          className="btn-primary"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustPlanForMissedTask(session.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Reagendar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-focus" />
                  <span className="text-sm font-medium">Tempo Total</span>
                </div>
                <div className="text-2xl font-bold">{weeklyPlan?.totalHours.toFixed(1)}h</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-progress" />
                  <span className="text-sm font-medium">Sessões</span>
                </div>
                <div className="text-2xl font-bold">{weeklyPlan?.sessions.length}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Cobertura por Matéria
              </h4>
              {getSubjectStats().map((stat) => (
                <div key={stat.subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stat.subject}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stat.completedTime}h / {stat.totalTime}h</span>
                      <span>({stat.completionRate}%)</span>
                    </div>
                  </div>
                  <Progress value={stat.coverage} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};