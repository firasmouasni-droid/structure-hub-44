
-- Add color column to calendar_events
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS color text DEFAULT '#A78BFA';

-- Create routines table
CREATE TABLE public.routines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  structure_id uuid REFERENCES public.structures(id) ON DELETE CASCADE,
  user_id uuid,
  morning_focus jsonb DEFAULT '{"start":"08:00","end":"12:00","focus":"deep_work","priority_filter":"high"}'::jsonb,
  afternoon_tasks jsonb DEFAULT '{"start":"14:00","end":"17:00","focus":"meetings_admin"}'::jsonb,
  email_slots jsonb DEFAULT '["09:00","13:00","17:30"]'::jsonb,
  availability_rules jsonb DEFAULT '{"weekdays":true,"weekends":false}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read routines" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Allow public insert routines" ON public.routines FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update routines" ON public.routines FOR UPDATE USING (true);
CREATE POLICY "Allow public delete routines" ON public.routines FOR DELETE USING (true);
