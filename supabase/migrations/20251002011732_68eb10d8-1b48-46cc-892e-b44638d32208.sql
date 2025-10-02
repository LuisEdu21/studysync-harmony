-- Remove the old provider constraint that only allows 'google' and 'microsoft'
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_provider_check;

-- Add new constraint that allows 'internal' for local events
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_provider_check 
  CHECK (provider IN ('google', 'microsoft', 'internal'));