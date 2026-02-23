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

    // 1. Get estimation coefficients (planning fallacy correction)
    const { data: coefficients } = await supabase
      .from("estimation_coefficients")
      .select("*");

    const coeffMap: Record<string, number> = {};
    for (const c of coefficients || []) {
      coeffMap[c.action_type] = c.coefficient;
    }

    // 2. Get unplanned tasks sorted by computed_priority DESC
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .is("due_date", null)
      .neq("status", "done")
      .order("computed_priority", { ascending: false })
      .limit(20);

    // 3. Get today's existing events
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", `${today}T00:00:00`)
      .lte("start_time", `${today}T23:59:59`);

    // 4. Get routines
    const { data: routines } = await supabase
      .from("routines")
      .select("*")
      .limit(1);

    const routine = routines?.[0] || null;

    // 5. Apply planning fallacy correction to estimated durations
    const correctedTasks = tasks?.map(t => {
      const coeff = coeffMap[t.action_type] || 1.3; // default 1.3x (30% buffer)
      const rawDuration = t.estimated_duration || 30;
      const correctedDuration = Math.ceil(rawDuration * coeff);
      return {
        id: t.id,
        label: t.action_label,
        type: t.action_type,
        priority: t.priority,
        importance: t.importance,
        urgency: t.urgency,
        computed_priority: t.computed_priority,
        raw_duration: rawDuration,
        corrected_duration: correctedDuration,
        structure_id: t.structure_id,
      };
    }) || [];

    // 6. Calculate available capacity (60-70% rule)
    const workdayMinutes = 8 * 60; // 8h workday
    const maxCapacity = Math.floor(workdayMinutes * 0.65); // 65% = sweet spot
    const existingMinutes = (events || []).reduce((sum, e) => {
      return sum + (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000;
    }, 0);
    const availableMinutes = Math.max(maxCapacity - existingMinutes, 0);

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
            content: `Tu es un planificateur IA basé sur les études scientifiques de productivité.

RÈGLES STRICTES:
1. CAPACITÉ MAX: ${availableMinutes} minutes disponibles aujourd'hui (65% de la journée, buffer pour imprévus — Planning Fallacy).
2. NE PAS dépasser cette capacité. Arrête de planifier quand la limite est atteinte.
3. GROUPAGE OBLIGATOIRE: Regroupe les tâches du même type consécutivement pour réduire le changement de contexte (Attention Residue).
4. DEEP WORK MATINAL (8h-12h): Place les tâches importantes NON urgentes (importance ≥ 4, urgency ≤ 3) dans cette zone. Blocs de 60-120 min max.
5. APRÈS-MIDI (14h-17h): Tâches urgentes, admin, meetings, emails.
6. Les durées sont DÉJÀ corrigées par le coefficient de planning fallacy.
7. Laisse 15 min de pause entre les blocs.
8. Tâches importantes & non urgentes → deep work matinal.
9. Tâches urgentes & importantes → traitement rapide hors deep work.

Réponds via l'outil plan_tasks. Ne planifie que ce qui rentre dans la capacité.`
          },
          {
            role: "user",
            content: `Date: ${today}
Capacité restante: ${availableMinutes} minutes

Tâches (triées par priorité calculée): ${JSON.stringify(correctedTasks)}

Événements existants: ${JSON.stringify(events?.map(e => ({ title: e.title, start: e.start_time, end: e.end_time })))}

Routine: ${JSON.stringify(routine)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "plan_tasks",
            description: "Assign time slots to tasks respecting scientific rules",
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
                      block_type: { type: "string", enum: ["deep_work", "admin", "meeting", "email", "other"], description: "Type of work block" },
                    },
                    required: ["task_id", "start_time", "end_time", "block_type"],
                    additionalProperties: false
                  }
                },
                capacity_used: { type: "number", description: "Total minutes planned" },
                capacity_remaining: { type: "number", description: "Minutes left available" },
                skipped_count: { type: "number", description: "Tasks not planned due to capacity" },
              },
              required: ["planned", "capacity_used", "capacity_remaining", "skipped_count"],
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

    const result = JSON.parse(toolCall.function.arguments);
    const { planned, capacity_used, capacity_remaining, skipped_count } = result;

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
        color: item.block_type === "deep_work" ? "#6366F1" : item.block_type === "email" ? "#3B82F6" : "#A78BFA",
      });

      await supabase.from("tasks").update({ due_date: today }).eq("id", task.id);
    }

    return new Response(JSON.stringify({
      planned: planned.length,
      items: planned,
      capacity_used,
      capacity_remaining,
      skipped_count,
      max_capacity: maxCapacity,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("autoplan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
