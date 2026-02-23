import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Structure {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  description: string | null;
  owner_id: string | null;
  life_space_id: string | null;
  created_at: string;
}

export function useStructures() {
  return useQuery({
    queryKey: ["structures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("structures")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as Structure[];
    },
  });
}

export function useStructure(id: string) {
  return useQuery({
    queryKey: ["structures", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("structures")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Structure | null;
    },
    enabled: !!id,
  });
}

export function useCreateStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (structure: { name: string; color: string; description?: string }) => {
      const { data, error } = await supabase.from("structures").insert(structure).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["structures"] }),
  });
}
