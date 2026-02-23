
-- Table for daily morning audit responses
CREATE TABLE public.daily_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level INTEGER NOT NULL DEFAULT 3 CHECK (energy_level BETWEEN 1 AND 5),
  mental_clarity TEXT NOT NULL DEFAULT 'normal',
  mood TEXT NOT NULL DEFAULT 'neutral',
  distraction_level TEXT NOT NULL DEFAULT 'focus',
  day_objective TEXT NOT NULL DEFAULT 'balance',
  cognitive_availability TEXT NOT NULL DEFAULT '2-4h',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, audit_date)
);

-- Enable RLS
ALTER TABLE public.daily_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read daily_audits" ON public.daily_audits FOR SELECT USING (true);
CREATE POLICY "Allow public insert daily_audits" ON public.daily_audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update daily_audits" ON public.daily_audits FOR UPDATE USING (true);
CREATE POLICY "Allow public delete daily_audits" ON public.daily_audits FOR DELETE USING (true);

-- Audit settings table
CREATE TABLE public.audit_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  audit_hour INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.audit_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read audit_settings" ON public.audit_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert audit_settings" ON public.audit_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update audit_settings" ON public.audit_settings FOR UPDATE USING (true);
