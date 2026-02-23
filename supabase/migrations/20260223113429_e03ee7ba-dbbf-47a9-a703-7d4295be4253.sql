
-- 1) Table structures
CREATE TABLE public.structures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text,
  color text NOT NULL DEFAULT 'bg-primary',
  description text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read structures" ON public.structures FOR SELECT USING (true);
CREATE POLICY "Allow public insert structures" ON public.structures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update structures" ON public.structures FOR UPDATE USING (true);
CREATE POLICY "Allow public delete structures" ON public.structures FOR DELETE USING (true);

-- 2) Table tasks
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  structure_id uuid NOT NULL REFERENCES public.structures(id) ON DELETE CASCADE,
  action_type text NOT NULL DEFAULT 'OTHER',
  action_label text NOT NULL,
  domain text,
  source text NOT NULL DEFAULT 'manual',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  estimated_duration integer, -- in minutes
  email_id text,
  external_link text,
  is_inbox boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tasks" ON public.tasks FOR DELETE USING (true);

-- 3) Table connectors
CREATE TABLE public.connectors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  structure_id uuid NOT NULL REFERENCES public.structures(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read connectors" ON public.connectors FOR SELECT USING (true);
CREATE POLICY "Allow public insert connectors" ON public.connectors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update connectors" ON public.connectors FOR UPDATE USING (true);

-- 4) Table goals
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  structure_id uuid NOT NULL REFERENCES public.structures(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  period text NOT NULL DEFAULT 'monthly',
  target_value integer,
  current_value integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Allow public insert goals" ON public.goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update goals" ON public.goals FOR UPDATE USING (true);

-- 5) Table user_stats
CREATE TABLE public.user_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_days integer NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read user_stats" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert user_stats" ON public.user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update user_stats" ON public.user_stats FOR UPDATE USING (true);

-- 6) Table calendar_events
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  structure_id uuid REFERENCES public.structures(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read calendar_events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update calendar_events" ON public.calendar_events FOR UPDATE USING (true);
