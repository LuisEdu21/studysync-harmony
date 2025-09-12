import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType?: 'exam' | 'assignment' | 'study' | 'other';
  subject?: string;
  provider: 'google' | 'microsoft';
}

export const useCalendarIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const connectCalendar = useCallback(async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.functions.invoke('calendar-auth', {
        body: { provider, redirectUri }
      });

      if (error) throw error;

      // Open OAuth popup
      const popup = window.open(
        data.authUrl,
        'calendar-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the OAuth callback
      return new Promise<boolean>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check if tokens were stored successfully
            checkCalendarConnection(provider).then(resolve).catch(reject);
          }
        }, 1000);

        // Handle message from popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'calendar-auth-success') {
            popup?.close();
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            resolve(true);
          } else if (event.data.type === 'calendar-auth-error') {
            popup?.close();
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', messageHandler);
      });

    } catch (error) {
      console.error('Calendar connection error:', error);
      toast({
        title: "Erro na conexão",
        description: `Falha ao conectar com ${provider}. Tente novamente.`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const disconnectCalendar = useCallback(async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_calendar_tokens')
        .delete()
        .eq('provider', provider);

      if (error) throw error;

      await supabase
        .from('calendar_sync_status')
        .update({ sync_enabled: false })
        .eq('provider', provider);

      toast({
        title: "Calendário desconectado",
        description: `${provider} foi desconectado com sucesso.`,
      });

      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Erro ao desconectar",
        description: "Falha ao desconectar o calendário.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const importEvents = useCallback(async (provider?: 'google' | 'microsoft') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        body: { operation: 'import', provider }
      });

      if (error) throw error;

      const successCount = data.results.reduce((count: number, result: any) => 
        count + (result.imported || 0), 0
      );

      toast({
        title: "Eventos importados",
        description: `${successCount} eventos foram importados com sucesso.`,
      });

      return data.results;
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: "Falha ao importar eventos do calendário.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createEvent = useCallback(async (
    eventData: Omit<CalendarEvent, 'id' | 'provider'>,
    provider: 'google' | 'microsoft'
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        body: { 
          operation: 'create_event', 
          provider,
          eventData
        }
      });

      if (error) throw error;

      toast({
        title: "Evento criado",
        description: `Evento "${eventData.title}" criado no ${provider}.`,
      });

      return data.results;
    } catch (error) {
      console.error('Create event error:', error);
      toast({
        title: "Erro ao criar evento",
        description: "Falha ao criar evento no calendário externo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getImportedEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get events error:', error);
      return [];
    }
  }, []);

  const checkCalendarConnection = useCallback(async (provider: 'google' | 'microsoft') => {
    try {
      const { data, error } = await supabase
        .from('user_calendar_tokens')
        .select('provider')
        .eq('provider', provider)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }, []);

  return {
    isLoading,
    connectCalendar,
    disconnectCalendar,
    importEvents,
    createEvent,
    getImportedEvents,
    checkCalendarConnection,
  };
};