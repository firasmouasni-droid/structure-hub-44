import { useQuery } from "@tanstack/react-query";
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
