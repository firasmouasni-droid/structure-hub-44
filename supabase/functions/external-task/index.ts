import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { structure_id, action_label, action_type, priority, due_date, estimated_duration, source } = await req.json();

    if (!structure_id || !action_label) {
      return new Response(JSON.stringify({ error: "structure_id and action_label are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data, error } = await supabase.from("tasks").insert({
      structure_id,
      action_label,
      action_type: action_type || "OTHER",
      priority: priority || "medium",
      due_date: due_date || null,
      estimated_duration: estimated_duration || null,
      source: source || "webhook",
      is_inbox: true,
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, task: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("external-task error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
