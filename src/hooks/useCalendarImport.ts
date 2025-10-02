import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse } from 'date-fns';

export interface CSVEvent {
  title: string;
  event_type: 'study' | 'exam' | 'assignment';
  subject?: string;
  description?: string;
  date: string;
  start_time: string;
  duration_minutes: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const useCalendarImport = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateTemplate = () => {
    const template = [
      'title,event_type,subject,description,date,start_time,duration_minutes',
      'Aula de Matemática,study,Matemática,Revisão de álgebra,2025-10-15,09:00,60',
      'Prova de História,exam,História,Prova sobre Segunda Guerra,2025-10-20,14:00,120',
      'Trabalho de Física,assignment,Física,Entrega do relatório de laboratório,2025-10-25,10:00,30'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'calendario_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (content: string): CSVEvent[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const events: CSVEvent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const event: any = {};

      headers.forEach((header, index) => {
        event[header] = values[index] || '';
      });

      events.push({
        title: event.title,
        event_type: event.event_type,
        subject: event.subject || undefined,
        description: event.description || undefined,
        date: event.date,
        start_time: event.start_time,
        duration_minutes: parseInt(event.duration_minutes) || 60
      });
    }

    return events;
  };

  const validateEvents = (events: CSVEvent[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const validEventTypes = ['study', 'exam', 'assignment'];

    events.forEach((event, index) => {
      const row = index + 2; // +2 because of header and 0-index

      if (!event.title || event.title.trim() === '') {
        errors.push({ row, field: 'title', message: 'Título é obrigatório' });
      }

      if (!validEventTypes.includes(event.event_type)) {
        errors.push({ 
          row, 
          field: 'event_type', 
          message: 'Tipo deve ser: study, exam ou assignment' 
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(event.date)) {
        errors.push({ 
          row, 
          field: 'date', 
          message: 'Data deve estar no formato YYYY-MM-DD' 
        });
      }

      // Validate time format (HH:mm)
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(event.start_time)) {
        errors.push({ 
          row, 
          field: 'start_time', 
          message: 'Hora deve estar no formato HH:mm' 
        });
      }

      // Validate duration
      if (isNaN(event.duration_minutes) || event.duration_minutes <= 0) {
        errors.push({ 
          row, 
          field: 'duration_minutes', 
          message: 'Duração deve ser um número positivo' 
        });
      }
    });

    return errors;
  };

  const convertToCalendarFormat = (event: CSVEvent) => {
    const startDateTime = parse(
      `${event.date} ${event.start_time}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    );

    const endDateTime = new Date(startDateTime.getTime() + event.duration_minutes * 60000);

    return {
      title: event.title,
      subject: event.subject,
      description: event.description,
      date: event.date,
      time: event.start_time,
      duration: event.duration_minutes,
      type: event.event_type as 'study' | 'exam' | 'assignment'
    };
  };

  const processFile = async (file: File): Promise<{ events: CSVEvent[], errors: ValidationError[] }> => {
    setIsProcessing(true);

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const events = parseCSV(content);
          const errors = validateEvents(events);

          setIsProcessing(false);
          resolve({ events, errors });
        } catch (error) {
          setIsProcessing(false);
          toast({
            title: "Erro ao processar arquivo",
            description: "Não foi possível ler o arquivo CSV",
            variant: "destructive"
          });
          resolve({ events: [], errors: [] });
        }
      };

      reader.onerror = () => {
        setIsProcessing(false);
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível ler o arquivo",
          variant: "destructive"
        });
        resolve({ events: [], errors: [] });
      };

      reader.readAsText(file);
    });
  };

  return {
    isProcessing,
    generateTemplate,
    processFile,
    convertToCalendarFormat
  };
};
