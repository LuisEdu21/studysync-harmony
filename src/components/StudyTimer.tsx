import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';

interface StudyTimerProps {
  onSessionComplete?: (type: 'study' | 'break', duration: number) => void;
  onProgressUpdate?: (type: 'study' | 'break', duration: number) => void;
}

export const StudyTimer = ({ onSessionComplete, onProgressUpdate }: StudyTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<'study' | 'break'>('study');
  const [totalTime, setTotalTime] = useState(25 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressSaveRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimeRef = useRef(0);

  const studyTime = 25 * 60; // 25 minutes
  const breakTime = 5 * 60; // 5 minutes

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        elapsedTimeRef.current += 1;
      }, 1000);

      // Save progress every 60 seconds for study sessions
      if (sessionType === 'study') {
        progressSaveRef.current = setInterval(() => {
          const elapsed = elapsedTimeRef.current;
          if (elapsed >= 60) {
            onProgressUpdate?.(sessionType, elapsed);
          }
        }, 60000); // Every minute
      }
    } else if (timeLeft === 0) {
      // Session completed
      const elapsed = totalTime - timeLeft;
      onSessionComplete?.(sessionType, elapsed);
      elapsedTimeRef.current = 0;
      
      // Auto switch to break or study
      if (sessionType === 'study') {
        setSessionType('break');
        setTimeLeft(breakTime);
        setTotalTime(breakTime);
      } else {
        setSessionType('study');
        setTimeLeft(studyTime);
        setTotalTime(studyTime);
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressSaveRef.current) {
        clearInterval(progressSaveRef.current);
      }
    };
  }, [isRunning, timeLeft, sessionType, onSessionComplete, onProgressUpdate, totalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    // When pausing a study session, save the progress
    if (isRunning && sessionType === 'study' && elapsedTimeRef.current > 0) {
      onProgressUpdate?.(sessionType, elapsedTimeRef.current);
      elapsedTimeRef.current = 0;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    // Save progress if there's elapsed time on a study session
    if (sessionType === 'study' && elapsedTimeRef.current > 0) {
      onProgressUpdate?.(sessionType, elapsedTimeRef.current);
    }
    setIsRunning(false);
    elapsedTimeRef.current = 0;
    const newTime = sessionType === 'study' ? studyTime : breakTime;
    setTimeLeft(newTime);
    setTotalTime(newTime);
  };

  const handleSessionSwitch = () => {
    // Save progress if switching from a study session with elapsed time
    if (sessionType === 'study' && elapsedTimeRef.current > 0) {
      onProgressUpdate?.(sessionType, elapsedTimeRef.current);
    }
    setIsRunning(false);
    elapsedTimeRef.current = 0;
    if (sessionType === 'study') {
      setSessionType('break');
      setTimeLeft(breakTime);
      setTotalTime(breakTime);
    } else {
      setSessionType('study');
      setTimeLeft(studyTime);
      setTotalTime(studyTime);
    }
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <Card className="card-study p-6 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          {sessionType === 'study' ? (
            <div className="w-3 h-3 bg-focus rounded-full"></div>
          ) : (
            <Coffee className="w-5 h-5 text-secondary" />
          )}
          <h3 className="text-lg font-semibold">
            {sessionType === 'study' ? 'Sessão de Estudo' : 'Pausa'}
          </h3>
        </div>

        <div className="relative">
          <div className="text-6xl font-mono font-bold text-focus mb-4">
            {formatTime(timeLeft)}
          </div>
          <Progress 
            value={progress} 
            className="h-2 mb-6"
          />
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleStartPause}
            size="lg"
            className="btn-primary bg-focus hover:bg-focus/90"
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="border-border hover:bg-muted"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleSessionSwitch}
            size="lg"
            variant="outline"
            className="border-border hover:bg-muted"
          >
            {sessionType === 'study' ? <Coffee className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {sessionType === 'study' 
            ? 'Mantenha o foco! Estude com concentração.' 
            : 'Hora da pausa! Relaxe e recarregue as energias.'
          }
        </div>
      </div>
    </Card>
  );
};