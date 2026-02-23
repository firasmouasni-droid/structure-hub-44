import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LifeSpace {
  id: string;
  key: string;
  label: string;
  icon: string;
  color: string;
  description: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
}

export function useLifeSpaces() {
  return useQuery({
    queryKey: ["life_spaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_spaces")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as LifeSpace[];
    },
  });
}

export function useActiveLifeSpaces() {
  const query = useLifeSpaces();
  return {
    ...query,
    data: query.data?.filter((s) => s.enabled) ?? [],
  };
}
