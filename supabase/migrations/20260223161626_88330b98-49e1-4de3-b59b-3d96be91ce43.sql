
-- Badges table for milestone achievements (Self-Determination Theory)
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  badge_id UUID NOT NULL REFERENCES public.badges(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- XP event log for tracking what behaviors earn XP
CREATE TABLE public.xp_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (true);

CREATE POLICY "Public read user_badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Public insert user_badges" ON public.user_badges FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read xp_events" ON public.xp_events FOR SELECT USING (true);
CREATE POLICY "Public insert xp_events" ON public.xp_events FOR INSERT WITH CHECK (true);

-- Seed milestone badges based on scientific studies
INSERT INTO public.badges (key, name, description, icon, category, xp_reward, condition_type, condition_value) VALUES
  ('deep_work_3', '3 jours de Deep Work', '3 sessions deep work complétées sans interruption', '🧠', 'deep_work', 100, 'deep_work_sessions', 3),
  ('deep_work_7', 'Semaine Deep Work', '7 sessions deep work en une semaine', '🔬', 'deep_work', 250, 'deep_work_sessions', 7),
  ('deep_work_30', 'Maître du Flow', '30 sessions deep work complétées', '🌊', 'deep_work', 500, 'deep_work_sessions', 30),
  ('wip_clean_3', 'WIP Maîtrisé ×3', '3 jours avec WIP sous le seuil', '⚡', 'wip', 100, 'wip_clean_days', 3),
  ('wip_clean_7', 'Kanban Scientist', '7 jours consécutifs sous la limite WIP', '🎯', 'wip', 250, 'wip_clean_days', 7),
  ('email_batch_3', 'Email Batcher', '3 jours de batching email respecté', '📧', 'email', 100, 'email_batch_days', 3),
  ('email_batch_7', 'Inbox Zero Hero', '7 jours de batching email respecté', '📭', 'email', 250, 'email_batch_days', 7),
  ('tasks_10', 'Productif ×10', '10 tâches complétées', '✅', 'tasks', 50, 'tasks_completed', 10),
  ('tasks_50', 'Machine de Guerre', '50 tâches complétées', '🚀', 'tasks', 200, 'tasks_completed', 50),
  ('tasks_100', 'Centurion', '100 tâches complétées', '💯', 'tasks', 500, 'tasks_completed', 100),
  ('streak_3', 'Régulier', '3 jours de streak', '🔥', 'streak', 50, 'streak_days', 3),
  ('streak_7', 'Endurant', '7 jours de streak', '💪', 'streak', 150, 'streak_days', 7),
  ('streak_30', 'Inarrêtable', '30 jours de streak', '🏆', 'streak', 500, 'streak_days', 30),
  ('backlog_zero', 'Backlog Zéro', 'Inbox IA totalement vide', '🎉', 'inbox', 100, 'inbox_zero', 1),
  ('goal_complete', 'Objectif Atteint', 'Premier objectif complété', '🎯', 'goals', 200, 'goals_completed', 1);
