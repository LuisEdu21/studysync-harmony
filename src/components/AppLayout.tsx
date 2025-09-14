import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Settings, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsModal } from '@/components/SettingsModal';
import BottomNavigation from '@/components/BottomNavigation';
import { useToast } from '@/hooks/use-toast';

const AppLayout = () => {
  const { user, signOut } = useAuth();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleNotificationsClick = () => {
    toast({
      title: "Notificações",
      description: "Você não tem notificações no momento.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">StudyFlow</h1>
                <p className="text-sm text-muted-foreground">Organize seus estudos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2"
                onClick={handleNotificationsClick}
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2"
                onClick={() => setSettingsModalOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2"
                title={user?.email || 'User'}
              >
                <User className="w-5 h-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2"
                onClick={signOut}
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation />

      {/* Settings Modal */}
      <SettingsModal 
        open={settingsModalOpen} 
        onOpenChange={setSettingsModalOpen}
        tasks={[]}
        sessions={[]}
        onRescheduleSession={() => {}}
      />
    </div>
  );
};

export default AppLayout;