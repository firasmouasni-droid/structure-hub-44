import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Goal {
  id: string;
  structure_id: string;
  title: string;
  description: string | null;
  period: string;
  target_value: number | null;
  current_value: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  kpi: string | null;
  kpi_unit: string | null;
  success_criteria: string | null;
  difficulty: string;
  status: string;
  parent_goal_id: string | null;
}

export interface GoalInsert {
  structure_id: string;
  title: string;
  description?: string | null;
  period?: string;
  target_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  kpi?: string | null;
  kpi_unit?: string | null;
  success_criteria?: string | null;
  difficulty?: string;
}

export function useGoals(structureId?: string) {
  return useQuery({
    queryKey: ["goals", structureId],
    queryFn: async () => {
      let query = supabase.from("goals").select("*").order("created_at");
      if (structureId) query = query.eq("structure_id", structureId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: GoalInsert) => {
      const { data, error } = await supabase.from("goals").insert(goal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
