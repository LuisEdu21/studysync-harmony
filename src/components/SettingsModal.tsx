import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSettings, CalendarSettings } from '@/contexts/SettingsContext';
import { Calendar, Clock, Download, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const { connectCalendar, disconnectCalendar, isLoading } = useCalendarIntegration();
  const [tempSettings, setTempSettings] = useState<CalendarSettings>(settings);

  const handleSave = () => {
    updateSettings(tempSettings);
    onOpenChange(false);
    toast({
      title: "Configurações salvas!",
      description: "Suas preferências foram atualizadas com sucesso.",
      duration: 3000,
    });
  };

  const handleCancel = () => {
    setTempSettings(settings);
    onOpenChange(false);
  };

  const handleConnectCalendar = async (type: 'google' | 'outlook') => {
    try {
      const provider = type === 'google' ? 'google' : 'microsoft';
      await connectCalendar(provider);
      
      // Update settings to enable the calendar
      setTempSettings(prev => ({
        ...prev,
        [type === 'google' ? 'googleCalendar' : 'outlookCalendar']: {
          ...prev[type === 'google' ? 'googleCalendar' : 'outlookCalendar'],
          enabled: true
        }
      }));

      toast({
        title: "Calendário conectado!",
        description: `${type === 'google' ? 'Google Calendar' : 'Outlook Calendar'} foi conectado com sucesso.`,
      });
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnectCalendar = async (type: 'google' | 'outlook') => {
    try {
      const provider = type === 'google' ? 'google' : 'microsoft';
      await disconnectCalendar(provider);
      
      // Update settings to disable the calendar
      setTempSettings(prev => ({
        ...prev,
        [type === 'google' ? 'googleCalendar' : 'outlookCalendar']: {
          ...prev[type === 'google' ? 'googleCalendar' : 'outlookCalendar'],
          enabled: false
        }
      }));
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  };

  const updateCalendarSetting = (
    calendar: 'googleCalendar' | 'outlookCalendar', 
    setting: string, 
    value: any
  ) => {
    setTempSettings(prev => ({
      ...prev,
      [calendar]: {
        ...prev[calendar],
        [setting]: value
      }
    }));
  };

  const updatePreferenceSetting = (
    category: 'importPreferences' | 'exportPreferences',
    setting: string,
    value: boolean
  ) => {
    setTempSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configurações de Calendário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  Google Calendar
                  {tempSettings.googleCalendar.enabled && (
                    <Badge variant="secondary">Ativo</Badge>
                  )}
                </div>
                <Switch
                  checked={tempSettings.googleCalendar.enabled}
                  disabled={isLoading}
                  onCheckedChange={(enabled) => {
                    if (enabled) {
                      handleConnectCalendar('google');
                    } else {
                      handleDisconnectCalendar('google');
                    }
                  }}
                />
              </CardTitle>
              <CardDescription>
                Sincronize eventos e compromissos com sua conta Google
              </CardDescription>
            </CardHeader>
            
            {tempSettings.googleCalendar.enabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="google-auto-sync">Sincronização automática</Label>
                  <Switch
                    id="google-auto-sync"
                    checked={tempSettings.googleCalendar.autoSync}
                    onCheckedChange={(checked) => 
                      updateCalendarSetting('googleCalendar', 'autoSync', checked)
                    }
                  />
                </div>
                
                {tempSettings.googleCalendar.autoSync && (
                  <div className="space-y-2">
                    <Label>Frequência de sincronização</Label>
                    <Select
                      value={tempSettings.googleCalendar.syncFrequency}
                      onValueChange={(value) => 
                        updateCalendarSetting('googleCalendar', 'syncFrequency', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Tempo real</SelectItem>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Outlook Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  Outlook Calendar
                  {tempSettings.outlookCalendar.enabled && (
                    <Badge variant="secondary">Ativo</Badge>
                  )}
                </div>
                <Switch
                  checked={tempSettings.outlookCalendar.enabled}
                  disabled={isLoading}
                  onCheckedChange={(enabled) => {
                    if (enabled) {
                      handleConnectCalendar('outlook');
                    } else {
                      handleDisconnectCalendar('outlook');
                    }
                  }}
                />
              </CardTitle>
              <CardDescription>
                Sincronize eventos e compromissos com sua conta Microsoft
              </CardDescription>
            </CardHeader>
            
            {tempSettings.outlookCalendar.enabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="outlook-auto-sync">Sincronização automática</Label>
                  <Switch
                    id="outlook-auto-sync"
                    checked={tempSettings.outlookCalendar.autoSync}
                    onCheckedChange={(checked) => 
                      updateCalendarSetting('outlookCalendar', 'autoSync', checked)
                    }
                  />
                </div>
                
                {tempSettings.outlookCalendar.autoSync && (
                  <div className="space-y-2">
                    <Label>Frequência de sincronização</Label>
                    <Select
                      value={tempSettings.outlookCalendar.syncFrequency}
                      onValueChange={(value) => 
                        updateCalendarSetting('outlookCalendar', 'syncFrequency', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Tempo real</SelectItem>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          <Separator />

          {/* Import Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Preferências de Importação
              </CardTitle>
              <CardDescription>
                Escolha quais tipos de eventos importar dos calendários externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="import-exams">Provas e exames</Label>
                <Switch
                  id="import-exams"
                  checked={tempSettings.importPreferences.importExams}
                  onCheckedChange={(checked) => 
                    updatePreferenceSetting('importPreferences', 'importExams', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="import-assignments">Trabalhos e entregas</Label>
                <Switch
                  id="import-assignments"
                  checked={tempSettings.importPreferences.importAssignments}
                  onCheckedChange={(checked) => 
                    updatePreferenceSetting('importPreferences', 'importAssignments', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="import-study">Sessões de estudo</Label>
                <Switch
                  id="import-study"
                  checked={tempSettings.importPreferences.importStudySessions}
                  onCheckedChange={(checked) => 
                    updatePreferenceSetting('importPreferences', 'importStudySessions', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Export Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Preferências de Exportação
              </CardTitle>
              <CardDescription>
                Escolha quais dados do StudyFlow sincronizar com calendários externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="export-study">Sessões de estudo</Label>
                <Switch
                  id="export-study"
                  checked={tempSettings.exportPreferences.exportStudySessions}
                  onCheckedChange={(checked) => 
                    updatePreferenceSetting('exportPreferences', 'exportStudySessions', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="export-tasks">Tarefas com prazo</Label>
                <Switch
                  id="export-tasks"
                  checked={tempSettings.exportPreferences.exportTasks}
                  onCheckedChange={(checked) => 
                    updatePreferenceSetting('exportPreferences', 'exportTasks', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Integração com Supabase necessária</p>
                  <p className="text-sm text-muted-foreground">
                    Para conectar calendários externos, é necessário integrar o projeto com Supabase 
                    para autenticação OAuth segura e armazenamento de tokens.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};