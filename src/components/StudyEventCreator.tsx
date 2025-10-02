import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudyEventCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: (event: any) => void;
}

export const StudyEventCreator: React.FC<StudyEventCreatorProps> = ({ 
  open, 
  onOpenChange, 
  onEventCreated 
}) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    date: '',
    startTime: '',
    duration: 60, // minutes
    type: 'study' as 'study' | 'exam' | 'assignment',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.startTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, data e horário.",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

      const eventData = {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        subject: formData.subject,
        eventType: formData.type,
      };

      onEventCreated?.(eventData);

      setFormData({
        title: '',
        subject: '',
        description: '',
        date: '',
        startTime: '',
        duration: 60,
        type: 'study',
      });

      onOpenChange(false);

      toast({
        title: "Evento criado!",
        description: "Sessão de estudo agendada com sucesso.",
      });

    } catch (error) {
      console.error('Create event error:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      subject: '',
      description: '',
      date: '',
      startTime: '',
      duration: 60,
      type: 'study',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Sessão de Estudo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Estudar Matemática - Cálculo"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Evento *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'study' | 'exam' | 'assignment') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="study">📚 Estudo</SelectItem>
                <SelectItem value="exam">📝 Prova</SelectItem>
                <SelectItem value="assignment">📋 Trabalho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Matéria</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Ex: Matemática"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tópicos a estudar, objetivos da sessão..."
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração</Label>
            <Select
              value={formData.duration.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Criar Sessão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};