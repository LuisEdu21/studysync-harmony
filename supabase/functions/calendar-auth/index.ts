import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  provider: 'google' | 'microsoft';
  code?: string;
  redirectUri: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, code, redirectUri }: AuthRequest = await req.json();

    // Security: Validate redirect URI against allowed patterns
    const ALLOWED_REDIRECT_PATTERNS = [
      /^https?:\/\/localhost:\d+/,
      /^https:\/\/.*\.lovableproject\.com/,
      /^https:\/\/.*\.supabase\.co/
    ];

    if (redirectUri && !ALLOWED_REDIRECT_PATTERNS.some(pattern => pattern.test(redirectUri))) {
      return new Response(
        JSON.stringify({ error: 'Invalid redirect URI' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from auth token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    if (!code) {
      // Return authorization URLs
      if (provider === 'google') {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${Deno.env.get('GOOGLE_CLIENT_ID')}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}&` +
          `access_type=offline&` +
          `prompt=consent`;
        
        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (provider === 'microsoft') {
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${Deno.env.get('MICROSOFT_CLIENT_ID')}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('https://graph.microsoft.com/calendars.readwrite offline_access')}&` +
          `response_mode=query`;
        
        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Exchange code for tokens
      let tokenResponse;
      
      if (provider === 'google') {
        const tokenRequest = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        tokenResponse = await tokenRequest.json();
      } else if (provider === 'microsoft') {
        const tokenRequest = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
            client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        tokenResponse = await tokenRequest.json();
      }

      if (tokenResponse.error) {
        throw new Error(`OAuth error: ${tokenResponse.error_description}`);
      }

      // Store tokens in database
      const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));
      
      const { error: insertError } = await supabaseClient
        .from('user_calendar_tokens')
        .upsert({
          user_id: user.id,
          provider,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'user_id,provider'
        });

      if (insertError) {
        throw insertError;
      }

      // Update sync status
      await supabaseClient
        .from('calendar_sync_status')
        .upsert({
          user_id: user.id,
          provider,
          sync_enabled: true,
        }, {
          onConflict: 'user_id,provider'
        });

      return new Response(
        JSON.stringify({ success: true, message: 'Calendar connected successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Calendar auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});