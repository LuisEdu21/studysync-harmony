import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationSettings } from './NotificationSettings';
import { Settings, Bell } from 'lucide-react';
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
            Gerencie suas preferências de notificação
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-12rem)] mt-4">
          <NotificationSettings
            settings={reminderSettings}
            onSettingsChange={setReminderSettings}
            permissionGranted={permissionGranted}
            onRequestPermission={requestNotificationPermission}
            activeRemindersCount={activeReminders.length}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};