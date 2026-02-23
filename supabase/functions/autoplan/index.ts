import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const today = new Date().toISOString().split("T")[0];

    // Get unplanned tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .is("due_date", null)
      .neq("status", "done")
      .order("priority", { ascending: false })
      .limit(20);

    // Get today's existing events
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", `${today}T00:00:00`)
      .lte("start_time", `${today}T23:59:59`);

    // Get routines
    const { data: routines } = await supabase
      .from("routines")
      .select("*")
      .limit(1);

    const routine = routines?.[0] || null;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un planificateur IA. Tu dois assigner des créneaux horaires aux tâches non planifiées en respectant les routines et les événements déjà planifiés. Réponds via l'outil plan_tasks."
          },
          {
            role: "user",
            content: `Planifie ces tâches pour aujourd'hui (${today}):

Tâches non planifiées: ${JSON.stringify(tasks?.map(t => ({ id: t.id, label: t.action_label, priority: t.priority, duration: t.estimated_duration || 30 })))}

Événements existants: ${JSON.stringify(events?.map(e => ({ title: e.title, start: e.start_time, end: e.end_time })))}

Routine: ${JSON.stringify(routine)}

Règles:
- Matin (8h-12h): tâches haute priorité / deep work
- Après-midi (14h-17h): meetings et admin
- Pas de chevauchement avec les événements existants
- Respecter les durées estimées`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "plan_tasks",
            description: "Assign time slots to tasks",
            parameters: {
              type: "object",
              properties: {
                planned: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      task_id: { type: "string" },
                      start_time: { type: "string", description: "ISO datetime" },
                      end_time: { type: "string", description: "ISO datetime" },
                    },
                    required: ["task_id", "start_time", "end_time"],
                    additionalProperties: false
                  }
                }
              },
              required: ["planned"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "plan_tasks" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Autoplan failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No plan generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planned } = JSON.parse(toolCall.function.arguments);

    // Create calendar events and update tasks
    for (const item of planned) {
      const task = tasks?.find(t => t.id === item.task_id);
      if (!task) continue;

      await supabase.from("calendar_events").insert({
        title: task.action_label,
        start_time: item.start_time,
        end_time: item.end_time,
        structure_id: task.structure_id,
        source: "ai",
      });

      await supabase.from("tasks").update({ due_date: today }).eq("id", task.id);
    }

    return new Response(JSON.stringify({ planned: planned.length, items: planned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("autoplan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
