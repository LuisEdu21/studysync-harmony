import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsContext';
import { Calendar, Download, Upload, RefreshCw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalendarIntegrationCardProps {
  onOpenSettings: () => void;
}

export const CalendarIntegrationCard: React.FC<CalendarIntegrationCardProps> = ({ onOpenSettings }) => {
  const { settings, hasAnyCalendarEnabled } = useSettings();
  const { toast } = useToast();

  const handleImportEvents = () => {
    if (!hasAnyCalendarEnabled) {
      toast({
        title: "Nenhum calendário conectado",
        description: "Configure a integração com Google Calendar ou Outlook para importar eventos.",
        duration: 3000,
      });
      return;
    }

    toast({
      title: "Importando eventos...",
      description: "Buscando novos compromissos dos calendários conectados.",
      duration: 3000,
    });
  };

  const handleSyncNow = () => {
    if (!hasAnyCalendarEnabled) {
      toast({
        title: "Nenhum calendário conectado",
        description: "Configure a integração para sincronizar dados.",
        duration: 3000,
      });
      return;
    }

    toast({
      title: "Sincronizando...",
      description: "Atualizando dados com os calendários conectados.",
      duration: 3000,
    });
  };

  const getConnectedCalendars = () => {
    const connected = [];
    if (settings.googleCalendar.enabled) connected.push('Google Calendar');
    if (settings.outlookCalendar.enabled) connected.push('Outlook Calendar');
    return connected;
  };

  const connectedCalendars = getConnectedCalendars();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Integração de Calendários
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="p-2"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          {hasAnyCalendarEnabled 
            ? `Conectado com ${connectedCalendars.join(' e ')}`
            : 'Configure integrações para sincronizar eventos externos'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasAnyCalendarEnabled ? (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings.googleCalendar.enabled && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Google Calendar</span>
                    <Badge variant="secondary">Conectado</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {settings.googleCalendar.autoSync ? 'Sync automático ativo' : 'Sync manual'}
                  </p>
                </div>
              )}
              
              {settings.outlookCalendar.enabled && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outlook Calendar</span>
                    <Badge variant="secondary">Conectado</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {settings.outlookCalendar.autoSync ? 'Sync automático ativo' : 'Sync manual'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportEvents}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Importar Eventos
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncNow}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar Agora
              </Button>
            </div>

            {/* Sync Info */}
            <div className="text-xs text-muted-foreground">
              <p>
                • Importando: {Object.entries(settings.importPreferences)
                  .filter(([_, enabled]) => enabled)
                  .map(([key, _]) => key.replace('import', '').replace(/([A-Z])/g, ' $1').toLowerCase())
                  .join(', ')}
              </p>
              <p>
                • Exportando: {Object.entries(settings.exportPreferences)
                  .filter(([_, enabled]) => enabled)
                  .map(([key, _]) => key.replace('export', '').replace(/([A-Z])/g, ' $1').toLowerCase())
                  .join(', ')}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Setup Instructions */}
            <div className="text-center py-6 space-y-3">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium">Nenhum calendário conectado</h3>
                <p className="text-sm text-muted-foreground">
                  Conecte seus calendários para importar compromissos e sincronizar eventos de estudo
                </p>
              </div>
              <Button onClick={onOpenSettings} className="mt-4">
                Configurar Integrações
              </Button>
            </div>

            {/* Features List */}
            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Com as integrações você poderá:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Importar provas, trabalhos e compromissos
                </li>
                <li className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Exportar sessões de estudo para seus calendários
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Sincronização automática ou manual
                </li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};