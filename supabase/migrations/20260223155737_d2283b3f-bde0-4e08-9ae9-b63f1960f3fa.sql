
-- Add scientific productivity fields to tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS importance integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS urgency integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS actual_duration integer NULL,
  ADD COLUMN IF NOT EXISTS computed_priority numeric GENERATED ALWAYS AS (
    importance * (1.0 + urgency::numeric / 5.0) / GREATEST(COALESCE(estimated_duration, 30), 1)
  ) STORED;

-- Add index for WIP queries (in-progress tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_status_structure ON public.tasks (status, structure_id);

-- Add estimation_coefficients table to track planning fallacy per user per action_type
CREATE TABLE IF NOT EXISTS public.estimation_coefficients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NULL,
  action_type text NOT NULL DEFAULT 'OTHER',
  coefficient numeric NOT NULL DEFAULT 1.3,
  sample_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type)
);

ALTER TABLE public.estimation_coefficients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read estimation_coefficients" ON public.estimation_coefficients FOR SELECT USING (true);
CREATE POLICY "Allow public insert estimation_coefficients" ON public.estimation_coefficients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update estimation_coefficients" ON public.estimation_coefficients FOR UPDATE USING (true);

COMMENT ON COLUMN public.tasks.importance IS 'Impact réel de la tâche (1-5, basé Goal Setting Theory)';
COMMENT ON COLUMN public.tasks.urgency IS 'Urgence objective de la tâche (1-5, basé Eisenhower)';
COMMENT ON COLUMN public.tasks.actual_duration IS 'Durée réelle en minutes (pour calibrer le planning fallacy)';
COMMENT ON COLUMN public.tasks.computed_priority IS 'Priorité calculée = importance × (1 + urgency/5) / effort';
COMMENT ON TABLE public.estimation_coefficients IS 'Coefficients de correction des estimations par type de tâche (planning fallacy)';
