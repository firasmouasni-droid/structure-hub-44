
-- Add subtask support and next_action field
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS next_action text NULL,
  ADD COLUMN IF NOT EXISTS is_refined boolean NOT NULL DEFAULT false;

-- Index for efficient subtask queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;

COMMENT ON COLUMN public.tasks.parent_task_id IS 'Référence vers la tâche parente (anti-procrastination: découpage auto)';
COMMENT ON COLUMN public.tasks.next_action IS 'Prochaine action concrète (Temporal Motivation Theory)';
COMMENT ON COLUMN public.tasks.is_refined IS 'Indique si la tâche a été reformulée/découpée par l IA';
