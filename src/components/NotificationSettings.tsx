import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  Zap, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface ReminderSettings {
  enabled: boolean;
  soundEnabled: boolean;
  urgencyMultiplier: number;
  minReminderInterval: number;
  maxReminderInterval: number;
  autoReschedule: boolean;
  rescheduleDelay: number;
}

interface NotificationSettingsProps {
  settings: ReminderSettings;
  onSettingsChange: (settings: ReminderSettings) => void;
  permissionGranted: boolean;
  onRequestPermission: () => Promise<boolean>;
  activeRemindersCount: number;
}

export const NotificationSettings = ({ 
  settings, 
  onSettingsChange, 
  permissionGranted,
  onRequestPermission,
  activeRemindersCount 
}: NotificationSettingsProps) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePermissionRequest = async () => {
    setIsRequesting(true);
    await onRequestPermission();
    setIsRequesting(false);
  };

  const updateSetting = <K extends keyof ReminderSettings>(
    key: K, 
    value: ReminderSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Lembretes Inteligentes</h3>
            <p className="text-sm text-muted-foreground">
              Configure notificações baseadas na urgência das suas tarefas
            </p>
          </div>
        </div>
        {activeRemindersCount > 0 && (
          <Badge variant="secondary" className="animate-pulse">
            {activeRemindersCount} ativo{activeRemindersCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Permission Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              permissionGranted ? 'bg-progress animate-pulse' : 'bg-destructive'
            }`} />
            <span className="text-sm font-medium">
              Permissão de Notificação
            </span>
          </div>
          {!permissionGranted && (
            <Button 
              size="sm" 
              onClick={handlePermissionRequest}
              disabled={isRequesting}
              className="btn-primary"
            >
              {isRequesting ? 'Solicitando...' : 'Permitir'}
            </Button>
          )}
        </div>
        
        {!permissionGranted && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Permissão Necessária</p>
                <p className="text-muted-foreground mt-1">
                  Para receber lembretes, você precisa permitir notificações do navegador.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Ativar Lembretes</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Receba notificações baseadas na urgência das tarefas
          </p>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => updateSetting('enabled', checked)}
          disabled={!permissionGranted}
        />
      </div>

      {settings.enabled && permissionGranted && (
        <>
          <Separator />

          {/* Sound Settings */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium">Som das Notificações</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Reproduzir som ao mostrar lembretes
              </p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>

          <Separator />

          {/* Reminder Frequency */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Frequência dos Lembretes</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Intervalo Mínimo</span>
                  <span className="text-sm font-medium">{settings.minReminderInterval} min</span>
                </div>
                <Slider
                  value={[settings.minReminderInterval]}
                  onValueChange={(value) => updateSetting('minReminderInterval', value[0])}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Intervalo Máximo</span>
                  <span className="text-sm font-medium">{settings.maxReminderInterval} min</span>
                </div>
                <Slider
                  value={[settings.maxReminderInterval]}
                  onValueChange={(value) => updateSetting('maxReminderInterval', value[0])}
                  min={60}
                  max={480}
                  step={30}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">
                💡 Tarefas mais urgentes recebem lembretes mais frequentes automaticamente
              </p>
            </div>
          </div>

          <Separator />

          {/* Urgency Multiplier */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Intensidade da Urgência</span>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Multiplicador</span>
                <span className="text-sm font-medium">{settings.urgencyMultiplier}x</span>
              </div>
              <Slider
                value={[settings.urgencyMultiplier]}
                onValueChange={(value) => updateSetting('urgencyMultiplier', value[0])}
                min={1}
                max={5}
                step={0.5}
                className="w-full"
              />
            </div>
            
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">
                ⚡ Quanto maior o multiplicador, mais frequentes serão os lembretes para tarefas urgentes
              </p>
            </div>
          </div>

          <Separator />

          {/* Auto Reschedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Reagendamento Automático</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reagenda sessões automaticamente quando ignoradas
                </p>
              </div>
              <Switch
                checked={settings.autoReschedule}
                onCheckedChange={(checked) => updateSetting('autoReschedule', checked)}
              />
            </div>

            {settings.autoReschedule && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Tempo de Espera</span>
                  <span className="text-sm font-medium">{settings.rescheduleDelay} min</span>
                </div>
                <Slider
                  value={[settings.rescheduleDelay]}
                  onValueChange={(value) => updateSetting('rescheduleDelay', value[0])}
                  min={15}
                  max={120}
                  step={15}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  🔄 Tempo para reagendar uma sessão após ser ignorada
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Status Summary */}
          <div className="p-4 rounded-lg bg-gradient-subtle">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-progress" />
              <span className="font-medium text-sm">Status do Sistema</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lembretes:</span>
                <span className="font-medium">
                  {settings.enabled ? 'Ativos' : 'Inativos'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Som:</span>
                <span className="font-medium">
                  {settings.soundEnabled ? 'Ativado' : 'Desativado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reagendamento:</span>
                <span className="font-medium">
                  {settings.autoReschedule ? 'Automático' : 'Manual'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permissão:</span>
                <span className="font-medium">
                  {permissionGranted ? 'Concedida' : 'Pendente'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};