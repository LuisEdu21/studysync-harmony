import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  provider?: 'google' | 'microsoft';
  operation: 'import' | 'export' | 'create_event';
  eventData?: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    subject?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, operation, eventData }: SyncRequest = await req.json();
    
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

    if (operation === 'import') {
      // Import events from calendars
      const results = [];
      const providers = provider ? [provider] : ['google', 'microsoft'];
      
      for (const currentProvider of providers) {
        try {
          const { data: tokens } = await supabaseClient
            .from('user_calendar_tokens')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', currentProvider)
            .single();

          if (!tokens) continue;

          // Refresh token if needed
          let accessToken = tokens.access_token;
          if (new Date(tokens.expires_at) < new Date()) {
            accessToken = await refreshAccessToken(currentProvider, tokens.refresh_token);
            
            // Update token in database
            await supabaseClient
              .from('user_calendar_tokens')
              .update({ 
                access_token: accessToken,
                expires_at: new Date(Date.now() + 3600000).toISOString()
              })
              .eq('id', tokens.id);
          }

          // Fetch events from calendar API
          const events = await fetchCalendarEvents(currentProvider, accessToken);
          
          // Process and store events
          for (const event of events) {
            const eventType = categorizeEvent(event.summary || event.subject);
            
            await supabaseClient
              .from('calendar_events')
              .upsert({
                user_id: user.id,
                external_id: event.id,
                provider: currentProvider,
                title: event.summary || event.subject,
                description: event.description || event.body?.content,
                start_time: event.start?.dateTime || event.start?.date,
                end_time: event.end?.dateTime || event.end?.date,
                event_type: eventType,
              }, {
                onConflict: 'user_id,external_id,provider'
              });
          }

          results.push({ provider: currentProvider, imported: events.length });
        } catch (error) {
          console.error(`Error importing from ${currentProvider}:`, error);
          results.push({ provider: currentProvider, error: error.message });
        }
      }

      // Update last sync time
      for (const currentProvider of providers) {
        await supabaseClient
          .from('calendar_sync_status')
          .update({ last_sync: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('provider', currentProvider);
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (operation === 'create_event' && eventData) {
      // Create event in external calendar
      const providers = provider ? [provider] : [];
      const results = [];

      for (const currentProvider of providers) {
        try {
          const { data: tokens } = await supabaseClient
            .from('user_calendar_tokens')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', currentProvider)
            .single();

          if (!tokens) continue;

          let accessToken = tokens.access_token;
          if (new Date(tokens.expires_at) < new Date()) {
            accessToken = await refreshAccessToken(currentProvider, tokens.refresh_token);
          }

          const createdEvent = await createCalendarEvent(currentProvider, accessToken, eventData);
          results.push({ provider: currentProvider, eventId: createdEvent.id });

        } catch (error) {
          console.error(`Error creating event in ${currentProvider}:`, error);
          results.push({ provider: currentProvider, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Calendar sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function refreshAccessToken(provider: string, refreshToken: string): Promise<string> {
  let response;
  
  if (provider === 'google') {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        grant_type: 'refresh_token',
      }),
    });
  } else {
    response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
        client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
        grant_type: 'refresh_token',
      }),
    });
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error_description}`);
  }
  
  return data.access_token;
}

async function fetchCalendarEvents(provider: string, accessToken: string) {
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Next 30 days
  
  if (provider === 'google') {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      { headers }
    );
    const data = await response.json();
    return data.items || [];
  } else {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '${timeMin}' and start/dateTime le '${timeMax}'&$orderby=start/dateTime`,
      { headers }
    );
    const data = await response.json();
    return data.value || [];
  }
}

async function createCalendarEvent(provider: string, accessToken: string, eventData: any) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  if (provider === 'google') {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description,
        start: { dateTime: eventData.startTime },
        end: { dateTime: eventData.endTime },
      }),
    });
    return await response.json();
  } else {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subject: eventData.title,
        body: { content: eventData.description, contentType: 'text' },
        start: { dateTime: eventData.startTime, timeZone: 'UTC' },
        end: { dateTime: eventData.endTime, timeZone: 'UTC' },
      }),
    });
    return await response.json();
  }
}

function categorizeEvent(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('prova') || titleLower.includes('exam') || titleLower.includes('teste')) {
    return 'exam';
  }
  if (titleLower.includes('trabalho') || titleLower.includes('assignment') || titleLower.includes('entrega')) {
    return 'assignment';
  }
  if (titleLower.includes('estudo') || titleLower.includes('study')) {
    return 'study';
  }
  return 'other';
}