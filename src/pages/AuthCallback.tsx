import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        window.opener?.postMessage({
          type: 'calendar-auth-error',
          error: error
        }, window.location.origin);
        window.close();
        return;
      }

      if (code) {
        try {
          // Determine provider from state or URL
          const provider = state?.includes('google') ? 'google' : 'microsoft';
          const redirectUri = `${window.location.origin}/auth/callback`;

          const { error: authError } = await supabase.functions.invoke('calendar-auth', {
            body: { provider, code, redirectUri }
          });

          if (authError) {
            throw authError;
          }

          window.opener?.postMessage({
            type: 'calendar-auth-success'
          }, window.location.origin);

        } catch (error) {
          console.error('Auth callback error:', error);
          window.opener?.postMessage({
            type: 'calendar-auth-error',
            error: error instanceof Error ? error.message : 'Authentication failed'
          }, window.location.origin);
        }
      }

      window.close();
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <h2 className="text-lg font-semibold">Conectando calendário...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Aguarde enquanto concluímos a conexão com seu calendário.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;