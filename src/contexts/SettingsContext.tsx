import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CalendarSettings {
  googleCalendar: {
    enabled: boolean;
    autoSync: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
  };
  outlookCalendar: {
    enabled: boolean;
    autoSync: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
  };
  importPreferences: {
    importExams: boolean;
    importAssignments: boolean;
    importStudySessions: boolean;
  };
  exportPreferences: {
    exportStudySessions: boolean;
    exportTasks: boolean;
  };
}

interface SettingsContextType {
  settings: CalendarSettings;
  updateSettings: (newSettings: Partial<CalendarSettings>) => void;
  hasAnyCalendarEnabled: boolean;
}

const defaultSettings: CalendarSettings = {
  googleCalendar: {
    enabled: false,
    autoSync: false,
    syncFrequency: 'hourly'
  },
  outlookCalendar: {
    enabled: false,
    autoSync: false,
    syncFrequency: 'hourly'
  },
  importPreferences: {
    importExams: true,
    importAssignments: true,
    importStudySessions: false
  },
  exportPreferences: {
    exportStudySessions: true,
    exportTasks: false
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('studyflow-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<CalendarSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to localStorage
    localStorage.setItem('studyflow-settings', JSON.stringify(updatedSettings));
  };

  const hasAnyCalendarEnabled = settings.googleCalendar.enabled || settings.outlookCalendar.enabled;

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, hasAnyCalendarEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
};