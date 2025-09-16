import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, CheckSquare, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DesktopNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/study-plan', icon: Brain, label: 'Plano de Estudo' },
    { path: '/tasks', icon: CheckSquare, label: 'Tarefas' },
    { path: '/calendar', icon: Calendar, label: 'Calendário' },
  ];

  return (
    <nav className="hidden md:flex items-center gap-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <Button
            key={item.path}
            asChild
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "gap-2 transition-all duration-200",
              isActive && "bg-primary/10 text-primary font-medium"
            )}
          >
            <NavLink to={item.path}>
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          </Button>
        );
      })}
    </nav>
  );
};

export default DesktopNavigation;