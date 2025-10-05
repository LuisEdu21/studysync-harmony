import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface WeeklyGoalSettingsProps {
  weeklyGoalMinutes: number;
  onWeeklyGoalChange: (minutes: number) => void;
}

export const WeeklyGoalSettings = ({ 
  weeklyGoalMinutes, 
  onWeeklyGoalChange 
}: WeeklyGoalSettingsProps) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Meta Semanal de Estudo</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="weekly-goal" className="text-sm">
            Tempo de estudo desejado por semana
          </Label>
          <span className="text-lg font-bold text-primary">
            {formatTime(weeklyGoalMinutes)}
          </span>
        </div>

        <Slider
          id="weekly-goal"
          min={60}
          max={2520} // 42 hours (6 hours * 7 days)
          step={30}
          value={[weeklyGoalMinutes]}
          onValueChange={(value) => onWeeklyGoalChange(value[0])}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1h/semana</span>
          <span>42h/semana</span>
        </div>

        <p className="text-sm text-muted-foreground">
          Meta diária sugerida: {formatTime(Math.floor(weeklyGoalMinutes / 7))}
        </p>
      </div>
    </Card>
  );
};
