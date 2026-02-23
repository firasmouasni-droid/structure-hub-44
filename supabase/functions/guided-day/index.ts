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

    // 1. Get active routine
    const { data: routines } = await supabase.from("routines").select("*").eq("is_active", true).limit(10);
    const routine = (structureFilter
      ? routines?.find((r: any) => r.structure_id === structureFilter)
      : null) || routines?.find((r: any) => !r.structure_id) || routines?.[0] || null;

    const blocks = (routine?.blocks as any[]) || [];
    const routineName = routine?.name || "Standard";

    // 2. Get unplanned tasks
    let taskQuery = supabase.from("tasks").select("*").is("due_date", null).neq("status", "done").order("computed_priority", { ascending: false }).limit(15);
    if (structureFilter) taskQuery = taskQuery.eq("structure_id", structureFilter);
    const { data: tasks } = await taskQuery;

    // 3. Get today's existing events
    const { data: events } = await supabase.from("calendar_events").select("*")
      .gte("start_time", `${today}T00:00:00`).lte("start_time", `${today}T23:59:59`);

    // 4. Get estimation coefficients
    const { data: coefficients } = await supabase.from("estimation_coefficients").select("*");
    const coeffMap: Record<string, number> = {};
    for (const c of coefficients || []) coeffMap[c.action_type] = c.coefficient;

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
        is_refined: t.is_refined,
      };
    }) || [];

    if (correctedTasks.length === 0) {
      return new Response(JSON.stringify({
        day_plan: [],
        splits: [],
        reformulations: [],
        routine_used: routineName,
        message: "Aucune tâche à planifier. Ajoutez des tâches dans l'inbox ou créez-en directement."
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 5. Build block slots description
    const workBlocks = blocks.filter((b: any) => b.type !== "break");
    const blockDesc = workBlocks.map((b: any) => `${b.label} (${b.start}-${b.end}, type: ${b.type})`).join("\n");

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
            content: `Tu es un assistant de productivité bienveillant. Tu prépares une JOURNÉE GUIDÉE pour un utilisateur potentiellement désorganisé.

Tu dois faire 3 choses :

1. **PLANIFIER** : Place les tâches dans les blocs de routine, en respectant les priorités et les types.
2. **DÉCOUPER** : Toute tâche >60 min doit être découpée en sous-tâches de 25-50 min. Donne des sous-tâches concrètes et actionnables.
3. **REFORMULER** : Toute tâche vague ou mal formulée doit être reformulée de manière claire et actionnable (verbe d'action + objet concret + résultat attendu).

ROUTINE : "${routineName}"
BLOCS DISPONIBLES :
${blockDesc || "09:00-12:00 Deep Work, 13:00-17:00 Admin"}

ÉVÉNEMENTS EXISTANTS (ne pas chevaucher) :
${JSON.stringify(events?.map(e => ({ title: e.title, start: e.start_time, end: e.end_time })))}

RÈGLES :
- Maximum 5-7 tâches par jour (anti-surcharge)
- Les tâches haute priorité/importance d'abord
- 5 min de marge entre les tâches
- Ton bienveillant : encourager, pas surcharger
- Si trop de tâches, les tâches excédentaires vont dans "reportées"

Réponds via l'outil build_guided_day.`
          },
          {
            role: "user",
            content: `Date: ${today}\n\nTâches disponibles :\n${JSON.stringify(correctedTasks)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "build_guided_day",
            description: "Build a guided day plan with splits and reformulations",
            parameters: {
              type: "object",
              properties: {
                day_plan: {
                  type: "array",
                  description: "Ordered list of tasks for the day",
                  items: {
                    type: "object",
                    properties: {
                      task_id: { type: "string", description: "Original task ID" },
                      original_label: { type: "string" },
                      start_time: { type: "string", description: "HH:MM format" },
                      end_time: { type: "string", description: "HH:MM format" },
                      block_type: { type: "string", enum: ["deep_work", "admin", "meetings", "email"] },
                      block_label: { type: "string", description: "Name of the routine block" },
                    },
                    required: ["task_id", "original_label", "start_time", "end_time", "block_type", "block_label"],
                    additionalProperties: false
                  }
                },
                splits: {
                  type: "array",
                  description: "Tasks that were split into subtasks",
                  items: {
                    type: "object",
                    properties: {
                      original_task_id: { type: "string" },
                      original_label: { type: "string" },
                      original_duration: { type: "number", description: "Minutes" },
                      subtasks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            duration: { type: "number" },
                            action_type: { type: "string" },
                          },
                          required: ["label", "duration", "action_type"],
                          additionalProperties: false
                        }
                      }
                    },
                    required: ["original_task_id", "original_label", "original_duration", "subtasks"],
                    additionalProperties: false
                  }
                },
                reformulations: {
                  type: "array",
                  description: "Tasks with improved labels",
                  items: {
                    type: "object",
                    properties: {
                      task_id: { type: "string" },
                      original_label: { type: "string" },
                      improved_label: { type: "string" },
                      reason: { type: "string", description: "Brief explanation of why reformulated" },
                    },
                    required: ["task_id", "original_label", "improved_label", "reason"],
                    additionalProperties: false
                  }
                },
                deferred: {
                  type: "array",
                  description: "Tasks deferred to another day",
                  items: {
                    type: "object",
                    properties: {
                      task_id: { type: "string" },
                      label: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["task_id", "label", "reason"],
                    additionalProperties: false
                  }
                },
                encouragement: { type: "string", description: "A short motivational message for the day" },
                total_planned_minutes: { type: "number" },
              },
              required: ["day_plan", "splits", "reformulations", "deferred", "encouragement", "total_planned_minutes"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "build_guided_day" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erreur de génération du plan guidé" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Pas de plan généré" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      ...result,
      routine_used: routineName,
      date: today,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("guided-day error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
