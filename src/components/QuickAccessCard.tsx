import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  count?: number;
  countLabel?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  children?: ReactNode;
}

const QuickAccessCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  count, 
  countLabel,
  variant = 'default',
  children 
}: QuickAccessCardProps) => {
  const variantStyles = {
    default: 'border-border hover:border-primary/20',
    primary: 'border-primary/20 bg-primary/5 hover:border-primary/30',
    success: 'border-progress/20 bg-progress/5 hover:border-progress/30',
    warning: 'border-energy/20 bg-energy/5 hover:border-energy/30'
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg cursor-pointer group",
      variantStyles[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              variant === 'primary' && "bg-primary/10 text-primary",
              variant === 'success' && "bg-progress/10 text-progress",
              variant === 'warning' && "bg-energy/10 text-energy",
              variant === 'default' && "bg-muted text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {count !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold">{count}</div>
              {countLabel && (
                <div className="text-xs text-muted-foreground">{countLabel}</div>
              )}
            </div>
          )}
        </div>
        
        {children && (
          <div className="mb-4">
            {children}
          </div>
        )}
        
        <Button 
          asChild 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between group-hover:bg-background/50"
        >
          <Link to={href}>
            Acessar
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickAccessCard;