import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Routine {
  id: string;
  structure_id: string | null;
  user_id: string | null;
  morning_focus: Record<string, unknown>;
  afternoon_tasks: Record<string, unknown>;
  email_slots: string[];
  availability_rules: Record<string, unknown>;
  created_at: string;
}

export function useRoutines() {
  return useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines" as any)
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as unknown as Routine[];
    },
  });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (routine: Partial<Routine>) => {
      const { data, error } = await supabase
        .from("routines" as any)
        .insert(routine as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Routine> & { id: string }) => {
      const { data, error } = await supabase
        .from("routines" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}
