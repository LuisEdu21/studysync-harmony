import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StudyEvent {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  type: 'study' | 'exam' | 'assignment';
  description?: string;
}

export const useStudyEvents = () => {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const studyEvents: StudyEvent[] = data.map(event => {
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        return {
          id: event.id,
          title: event.title,
          subject: event.subject || '',
          date: startTime.toISOString().split('T')[0],
          time: startTime.toTimeString().substring(0, 5),
          duration,
          type: (event.event_type as 'study' | 'exam' | 'assignment') || 'study',
          description: event.description || undefined
        };
      });

      setEvents(studyEvents);
    } catch (error) {
      console.error('Error fetching study events:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos de estudo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData: Omit<StudyEvent, 'id'>) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      console.log('Creating event with data:', eventData);
      const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + eventData.duration * 60000);

      console.log('Start time:', startDateTime.toISOString());
      console.log('End time:', endDateTime.toISOString());

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title: eventData.title,
          subject: eventData.subject,
          description: eventData.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          event_type: eventData.type,
          provider: 'internal',
          external_id: `internal_${Date.now()}`
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Event created successfully:', data);

      const newEvent: StudyEvent = {
        id: data.id,
        title: data.title,
        subject: data.subject || '',
        date: eventData.date,
        time: eventData.time,
        duration: eventData.duration,
        type: eventData.type,
        description: data.description || undefined
      };

      setEvents(prev => [...prev, newEvent]);

      toast({
        title: 'Evento criado!',
        description: `${eventData.title} foi adicionado ao seu calendário.`,
      });

      return newEvent;
    } catch (error) {
      console.error('Error adding study event:', error);
      toast({
        title: 'Erro ao criar evento',
        description: error instanceof Error ? error.message : 'Não foi possível criar o evento de estudo.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<StudyEvent>) => {
    if (!user) return;

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const updatedEvent = { ...event, ...eventData };
      const startDateTime = new Date(`${updatedEvent.date}T${updatedEvent.time}`);
      const endDateTime = new Date(startDateTime.getTime() + updatedEvent.duration * 60000);

      const { error } = await supabase
        .from('calendar_events')
        .update({
          title: updatedEvent.title,
          subject: updatedEvent.subject,
          description: updatedEvent.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          event_type: updatedEvent.type
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));

      toast({
        title: 'Evento atualizado!',
        description: `${updatedEvent.title} foi atualizado.`,
      });
    } catch (error) {
      console.error('Error updating study event:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o evento.',
        variant: 'destructive'
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== eventId));

      toast({
        title: 'Evento removido!',
        description: 'O evento foi removido do seu calendário.',
      });
    } catch (error) {
      console.error('Error deleting study event:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o evento.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};