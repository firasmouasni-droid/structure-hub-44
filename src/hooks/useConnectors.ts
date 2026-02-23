import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface Connector {
  id: string;
  structure_id: string;
  type: string;
  provider: string;
  config: Json | null;
  active: boolean;
  created_at: string;
}

export function useConnectors(structureId?: string) {
  return useQuery({
    queryKey: ["connectors", structureId],
    queryFn: async () => {
      let query = supabase.from("connectors").select("*").order("created_at");
      if (structureId) query = query.eq("structure_id", structureId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Connector[];
    },
  });
}

export function useCreateConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connector: { structure_id: string; type: string; provider: string; config?: Json | null; active?: boolean }) => {
      const { data, error } = await supabase.from("connectors").insert(connector).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}

export function useUpdateConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; active?: boolean; config?: Json | null }) => {
      const { data, error } = await supabase.from("connectors").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}
