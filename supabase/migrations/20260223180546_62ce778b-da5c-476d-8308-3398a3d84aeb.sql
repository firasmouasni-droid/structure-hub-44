
CREATE TABLE public.work_hours_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NULL,
  work_start text NOT NULL DEFAULT '09:00',
  work_end text NOT NULL DEFAULT '18:00',
  pause_start text NOT NULL DEFAULT '12:00',
  pause_end text NOT NULL DEFAULT '13:00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.work_hours_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read work_hours_settings" ON public.work_hours_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert work_hours_settings" ON public.work_hours_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update work_hours_settings" ON public.work_hours_settings FOR UPDATE USING (true);
