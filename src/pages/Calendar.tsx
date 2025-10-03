import { useState } from 'react';
import { StudyCalendar } from '@/components/StudyCalendar';
import { StudyEventCreator } from '@/components/StudyEventCreator';
import { CalendarImport } from '@/components/CalendarImport';
import { useStudyEvents } from '@/hooks/useStudyEvents';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

const Calendar = () => {
  const [eventCreatorOpen, setEventCreatorOpen] = useState(false);
  const { events: studyEvents, addEvent } = useStudyEvents();
  const { toast } = useToast();

  const handleBulkImport = async (importedEvents: any[]) => {
    for (const event of importedEvents) {
      await addEvent(event);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20 md:pb-8">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card className="card-study p-6 bg-gradient-primary text-white">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold mb-1">Calendário de Estudos</h1>
                <p className="text-white/90">
                  Gerencie seus eventos, importe calendários e planeje suas sessões
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar View */}
          <div className="space-y-8">
            <StudyCalendar 
              events={studyEvents} 
              onEventClick={(event) => {
                toast({
                  title: event.title,
                  description: `${event.subject} - ${event.time}`,
                  duration: 3000,
                });
              }}
              onCreateEvent={() => setEventCreatorOpen(true)}
            />
          </div>

          {/* Import & Tools */}
          <div className="space-y-8">
            <CalendarImport onImport={handleBulkImport} />
          </div>
        </div>
      </main>

      {/* Study Event Creator Modal */}
      <StudyEventCreator
        open={eventCreatorOpen}
        onOpenChange={setEventCreatorOpen}
        onEventCreated={async (event) => {
          const newEvent = {
            title: event.title,
            subject: event.subject || '',
            date: event.startTime.split('T')[0],
            time: event.startTime.split('T')[1]?.substring(0, 5) || '',
            duration: Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000),
            type: event.eventType || 'study',
            description: event.description
          };
          await addEvent(newEvent);
        }}
      />
    </div>
  );
};

export default Calendar;
