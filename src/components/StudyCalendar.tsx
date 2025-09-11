import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

interface StudyEvent {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: 'study' | 'exam' | 'assignment';
}

interface StudyCalendarProps {
  events: StudyEvent[];
  onEventClick?: (event: StudyEvent) => void;
}

export const StudyCalendar = ({ events, onEventClick }: StudyCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const today = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-destructive text-destructive-foreground';
      case 'assignment': return 'bg-warning text-warning-foreground';
      case 'study': return 'bg-focus text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <Card className="card-study p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-focus" />
          Calendário Semanal
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigateWeek('prev')}
            size="sm"
            variant="outline"
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setCurrentDate(new Date())}
            size="sm"
            variant="outline"
            className="px-3"
          >
            Hoje
          </Button>
          <Button
            onClick={() => navigateWeek('next')}
            size="sm"
            variant="outline"
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {currentWeek.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentDay = isToday(date);
          
          return (
            <div key={index} className="space-y-2">
              <div className="text-center">
                <div className="text-xs text-muted-foreground font-medium">
                  {weekDays[index]}
                </div>
                <div 
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                    isCurrentDay 
                      ? 'bg-focus text-primary-foreground' 
                      : 'text-foreground'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
              
              <div className="space-y-1 min-h-[100px]">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`w-full p-2 rounded text-xs text-left transition-all hover:scale-105 ${getEventTypeColor(event.type)}`}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="flex items-center gap-1 mt-1 opacity-90">
                      <Clock className="w-3 h-3" />
                      <span>{event.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-focus rounded"></div>
            <span>Estudo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded"></div>
            <span>Trabalho</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span>Prova</span>
          </div>
        </div>
      </div>
    </Card>
  );
};