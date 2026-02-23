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

    const { task_id, action } = await req.json();
    // action: "split" | "refine" | "both"

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shouldSplit = (action === "split" || action === "both") && (task.estimated_duration || 30) > 60;
    const shouldRefine = action === "refine" || action === "both";

    const systemPrompt = `Tu es un assistant de productivité basé sur la science (Temporal Motivation Theory, Flow de Csikszentmihalyi).

RÈGLES:
1. DÉCOUPAGE (si demandé): Les tâches >60 min doivent être découpées en sous-tâches de 20-45 min chacune. Chaque sous-tâche doit être une action concrète et claire.
2. REFORMULATION (si demandé): Les tâches vagues doivent être reformulées en actions précises avec un verbe d'action, un livrable, et une durée.
   Exemple: "Avancer sur Qualiopi" → "Rédiger la section 2 — preuves matérielles (30 min)"
3. NEXT ACTION: Propose toujours une prochaine action concrète pour la tâche.

Réponds via l'outil refine_task.`;

    const userPrompt = `Tâche à traiter:
- Titre: "${task.action_label}"
- Type: ${task.action_type}
- Durée estimée: ${task.estimated_duration || 30} min
- Priorité: ${task.priority}
- Importance: ${task.importance}/5
- Urgence: ${task.urgency}/5

Actions demandées: ${shouldSplit ? "DÉCOUPAGE en sous-tâches" : ""} ${shouldRefine ? "REFORMULATION claire" : ""}`;

    const tools = [{
      type: "function" as const,
      function: {
        name: "refine_task",
        description: "Refine and/or split a task",
        parameters: {
          type: "object",
          properties: {
            refined_label: { type: "string", description: "Reformulated clear task label with action verb + deliverable + duration" },
            next_action: { type: "string", description: "The very next concrete step to take" },
            subtasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string", description: "Clear subtask label" },
                  duration: { type: "number", description: "Duration in minutes (20-45)" },
                  action_type: { type: "string" },
                },
                required: ["label", "duration", "action_type"],
                additionalProperties: false,
              },
              description: "Subtasks if splitting (empty array if not splitting)"
            },
          },
          required: ["refined_label", "next_action", "subtasks"],
          additionalProperties: false,
        },
      },
    }];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "refine_task" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI refinement failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No refinement generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Update the parent task
    await supabase.from("tasks").update({
      action_label: result.refined_label,
      next_action: result.next_action,
      is_refined: true,
    }).eq("id", task_id);

    // Create subtasks if any
    const createdSubtasks = [];
    for (const sub of result.subtasks || []) {
      const { data: created } = await supabase.from("tasks").insert({
        structure_id: task.structure_id,
        action_type: sub.action_type || task.action_type,
        action_label: sub.label,
        priority: task.priority,
        importance: task.importance,
        urgency: task.urgency,
        estimated_duration: sub.duration,
        parent_task_id: task_id,
        source: "ai",
        is_refined: true,
      }).select().single();
      if (created) createdSubtasks.push(created);
    }

    return new Response(JSON.stringify({
      refined_label: result.refined_label,
      next_action: result.next_action,
      subtasks_created: createdSubtasks.length,
      subtasks: createdSubtasks,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("task-refine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
