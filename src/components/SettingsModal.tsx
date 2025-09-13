import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIntegrationCard } from './CalendarIntegrationCard';
import { NotificationSettings } from './NotificationSettings';
import { Settings, Calendar, Bell } from 'lucide-react';
import { useSmartReminders } from '@/hooks/useSmartReminders';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks?: any[];
  sessions?: any[];
  onRescheduleSession?: (sessionId: string, newDateTime?: string) => void;
}

export const SettingsModal = ({ 
  open, 
  onOpenChange, 
  tasks = [], 
  sessions = [],
  onRescheduleSession 
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState('calendar');
  
  const {
    settings: reminderSettings,
    setSettings: setReminderSettings,
    activeReminders,
    permissionGranted,
    requestNotificationPermission
  } = useSmartReminders(tasks, sessions, onRescheduleSession);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações
          </DialogTitle>
          <DialogDescription>
            Gerencie suas integrações de calendário e preferências de notificação
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendários
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(85vh-12rem)] mt-4">
            <TabsContent value="calendar" className="mt-6">
              <CalendarIntegrationCard onOpenSettings={() => {}} />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <NotificationSettings
                settings={reminderSettings}
                onSettingsChange={setReminderSettings}
                permissionGranted={permissionGranted}
                onRequestPermission={requestNotificationPermission}
                activeRemindersCount={activeReminders.length}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};