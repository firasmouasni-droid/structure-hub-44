import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Task {
  id: string;
  structure_id: string;
  action_type: string;
  action_label: string;
  domain: string | null;
  source: string;
  priority: string;
  status: string;
  due_date: string | null;
  estimated_duration: number | null;
  email_id: string | null;
  external_link: string | null;
  is_inbox: boolean;
  created_at: string;
}

export interface TaskInsert {
  structure_id: string;
  action_type: string;
  action_label: string;
  domain?: string | null;
  source?: string;
  priority?: string;
  status?: string;
  due_date?: string | null;
  estimated_duration?: number | null;
  email_id?: string | null;
  external_link?: string | null;
  is_inbox?: boolean;
}

export function useTasks(filters?: { structureId?: string; status?: string; isInbox?: boolean; dueDateToday?: boolean }) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let query = supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (filters?.structureId) query = query.eq("structure_id", filters.structureId);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.isInbox !== undefined) query = query.eq("is_inbox", filters.isInbox);
      if (filters?.dueDateToday) {
        const today = new Date().toISOString().split("T")[0];
        query = query.eq("due_date", today);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useTasksByStructure(structureId: string) {
  return useTasks({ structureId });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase.from("tasks").insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
