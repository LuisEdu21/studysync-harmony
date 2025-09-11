import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e06ec1e11a934190a389f30e6fd9ee60',
  appName: 'StudyFlow',
  webDir: 'dist',
  server: {
    url: 'https://e06ec1e1-1a93-4190-a389-f30e6fd9ee60.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#1e40af",
      sound: "beep.wav",
    },
  },
};

export default config;