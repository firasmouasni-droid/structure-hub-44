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

    const body = await req.json().catch(() => ({}));
    const structureFilter = body.structure_id || null;

    // 1. Get estimation coefficients (planning fallacy correction)
    const { data: coefficients } = await supabase.from("estimation_coefficients").select("*");
    const coeffMap: Record<string, number> = {};
    for (const c of coefficients || []) {
      coeffMap[c.action_type] = c.coefficient;
    }

    // 2. Get unplanned tasks sorted by computed_priority DESC
    let taskQuery = supabase.from("tasks").select("*").is("due_date", null).neq("status", "done").order("computed_priority", { ascending: false }).limit(20);
    if (structureFilter) taskQuery = taskQuery.eq("structure_id", structureFilter);
    const { data: tasks } = await taskQuery;

    // 3. Get today's existing REAL events (not routine placeholders)
    let eventQuery = supabase.from("calendar_events").select("*").gte("start_time", `${today}T00:00:00`).lte("start_time", `${today}T23:59:59`);
    const { data: events } = await eventQuery;

    // 4. Get routines — these are RULES for placement, NOT events
    const { data: routines } = await supabase.from("routines").select("*").limit(5);
    
    // Find applicable routine: structure-specific or global
    const routine = (structureFilter 
      ? routines?.find((r: any) => r.structure_id === structureFilter) 
      : null) || routines?.find((r: any) => !r.structure_id) || routines?.[0] || null;

    // Parse routine into placement rules
    const morningFocus = routine?.morning_focus as any || { start: "08:00", end: "12:00", focus: "deep_work" };
    const afternoonTasks = routine?.afternoon_tasks as any || { start: "14:00", end: "17:00", focus: "meetings_admin" };
    const emailSlots = (routine?.email_slots as any) || ["09:00", "13:00", "17:30"];

    // 5. Apply planning fallacy correction
    const correctedTasks = tasks?.map(t => {
      const coeff = coeffMap[t.action_type] || 1.3;
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

    // 6. Calculate available capacity (65% rule)
    const workdayMinutes = 8 * 60;
    const maxCapacity = Math.floor(workdayMinutes * 0.65);
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
            content: `Tu es un planificateur IA scientifique. Tu places des TÂCHES dans le calendrier en respectant les routines de l'utilisateur.

IMPORTANT — LES ROUTINES SONT DES RÈGLES DE PLACEMENT, PAS DES ÉVÉNEMENTS :
- Les routines définissent QUAND placer QUEL TYPE de tâche
- Tu ne dois JAMAIS créer d'événements "Deep Work", "Emails", "Réunions" — ce sont des zones, pas des actions
- Tu places les VRAIES TÂCHES DANS ces zones

RÈGLES DE PLACEMENT (basées sur les routines de l'utilisateur) :
- Zone matin (${morningFocus.start}-${morningFocus.end}, type: ${morningFocus.focus}) → Place ici les tâches de fond importantes : WRITING, ANALYSIS, STRATEGY, DEVELOPMENT, tâches avec importance ≥ 4
- Zone après-midi (${afternoonTasks.start}-${afternoonTasks.end}, type: ${afternoonTasks.focus}) → Place ici les tâches MEETING, CALL, ADMIN, et tâches urgentes légères
- Créneaux email (${emailSlots.join(", ")}) → Place ici les tâches EMAIL, REPLY (30 min chacun)

RÈGLES DE CAPACITÉ :
1. CAPACITÉ MAX: ${availableMinutes} minutes disponibles
2. NE PAS dépasser cette capacité
3. Les durées sont DÉJÀ corrigées par le coefficient de Planning Fallacy
4. 15 min de pause entre les blocs
5. Respecte les événements existants (ne pas chevaucher)
6. Si la zone matin est déjà occupée par des événements réels, utilise l'espace RESTANT dans cette zone

GROUPAGE : Regroupe les tâches du même type consécutivement (Attention Residue).

Réponds via l'outil plan_tasks.`
          },
          {
            role: "user",
            content: `Date: ${today}
Capacité restante: ${availableMinutes} minutes

Tâches à placer (triées par priorité): ${JSON.stringify(correctedTasks)}

Événements RÉELS existants (à ne pas chevaucher): ${JSON.stringify(events?.map(e => ({ title: e.title, start: e.start_time, end: e.end_time })))}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "plan_tasks",
            description: "Place tasks in specific time slots respecting routine zones and existing events",
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
                      block_type: { type: "string", enum: ["deep_work", "admin", "meeting", "email", "other"] },
                    },
                    required: ["task_id", "start_time", "end_time", "block_type"],
                    additionalProperties: false
                  }
                },
                capacity_used: { type: "number" },
                capacity_remaining: { type: "number" },
                skipped_count: { type: "number" },
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

    // Create calendar events for TASKS ONLY (not routine blocks)
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
