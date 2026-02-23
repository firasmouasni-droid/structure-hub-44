import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RoutineBlock {
  type: string;
  start: string;
  end: string;
  label: string;
  days?: string[];
}

function blockMinutes(block: RoutineBlock): number {
  const [sh, sm] = block.start.split(":").map(Number);
  const [eh, em] = block.end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function subtractOccupied(
  blockStart: string, blockEnd: string, today: string,
  existingEvents: { start_time: string; end_time: string }[]
): { start: string; end: string }[] {
  const toMin = (t: string) => {
    const d = new Date(t);
    return d.getHours() * 60 + d.getMinutes();
  };
  const [bsH, bsM] = blockStart.split(":").map(Number);
  const [beH, beM] = blockEnd.split(":").map(Number);
  const bStart = bsH * 60 + bsM;
  const bEnd = beH * 60 + beM;

  // Get overlapping events within this block
  const overlaps = existingEvents
    .map(e => ({ s: Math.max(toMin(e.start_time), bStart), e: Math.min(toMin(e.end_time), bEnd) }))
    .filter(o => o.s < o.e)
    .sort((a, b) => a.s - b.s);

  const freeSlots: { start: string; end: string }[] = [];
  let cursor = bStart;
  for (const o of overlaps) {
    if (cursor < o.s) {
      freeSlots.push({
        start: `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`,
        end: `${String(Math.floor(o.s / 60)).padStart(2, "0")}:${String(o.s % 60).padStart(2, "0")}`,
      });
    }
    cursor = Math.max(cursor, o.e);
  }
  if (cursor < bEnd) {
    freeSlots.push({
      start: `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`,
      end: `${String(Math.floor(bEnd / 60)).padStart(2, "0")}:${String(bEnd % 60).padStart(2, "0")}`,
    });
  }
  return freeSlots;
}

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

    // 3. Get today's existing REAL events
    const { data: events } = await supabase.from("calendar_events").select("*")
      .gte("start_time", `${today}T00:00:00`).lte("start_time", `${today}T23:59:59`);

    // 4. Get routines — find the ACTIVE one with its blocks
    const { data: routines } = await supabase.from("routines").select("*").eq("is_active", true).limit(10);

    const routine = (structureFilter
      ? routines?.find((r: any) => r.structure_id === structureFilter)
      : null) || routines?.find((r: any) => !r.structure_id) || routines?.[0] || null;

    // 5. Parse routine blocks — the core of Module 4
    const blocks: RoutineBlock[] = (routine?.blocks as RoutineBlock[]) || [];
    const emailSlots = (routine?.email_slots as string[]) || ["09:00", "13:00", "17:30"];
    const routineName = routine?.name || "Aucune routine";
    const routineType = routine?.routine_type || "custom";

    // Compute free slots per block type (excluding breaks and existing events)
    const workBlocks = blocks.filter(b => b.type !== "break");
    const blockSlots = workBlocks.map(block => {
      const freeSlots = subtractOccupied(block.start, block.end, today, events || []);
      const freeMinutes = freeSlots.reduce((sum, s) => {
        const [sh, sm] = s.start.split(":").map(Number);
        const [eh, em] = s.end.split(":").map(Number);
        return sum + (eh * 60 + em) - (sh * 60 + sm);
      }, 0);
      return {
        type: block.type,
        label: block.label,
        start: block.start,
        end: block.end,
        totalMinutes: blockMinutes(block),
        freeMinutes,
        freeSlots,
      };
    });

    const totalFreeMinutes = blockSlots.reduce((sum, b) => sum + b.freeMinutes, 0);

    // 6. Apply planning fallacy correction
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

    // 7. Apply 65% capacity rule on total free time
    const maxCapacity = Math.floor(totalFreeMinutes * 0.65);

    // 8. Build the detailed prompt with block-aware placement rules
    const blockRulesText = blockSlots.map(b =>
      `- ${b.label} (${b.start}-${b.end}, type: ${b.type}) → ${b.freeMinutes} min libres. Créneaux: ${b.freeSlots.map(s => `${s.start}-${s.end}`).join(", ") || "AUCUN (entièrement occupé)"}`
    ).join("\n");

    const taskTypeMapping = `
RÈGLES DE CORRESPONDANCE TÂCHE → BLOC :
- deep_work blocks → WRITE, BUILD, PLAN, REVIEW, LEARN + toute tâche avec importance ≥ 4
- admin blocks → ADMIN, OTHER, tâches importance < 3
- meetings blocks → CALL, MEETING
- email blocks (créneaux: ${emailSlots.join(", ")}) → EMAIL (30 min chacun)
- Si un bloc est plein, placer dans le PROCHAIN bloc compatible ou dans un bloc admin`;

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
            content: `Tu es un planificateur IA scientifique. Tu places des TÂCHES dans le calendrier en respectant STRICTEMENT les blocs de la routine active de l'utilisateur.

ROUTINE ACTIVE : "${routineName}" (type: ${routineType})

BLOCS DE LA ROUTINE (avec disponibilité réelle après événements existants) :
${blockRulesText}

${taskTypeMapping}

RÈGLES CRITIQUES :
1. CAPACITÉ MAX: ${maxCapacity} minutes (65% de ${totalFreeMinutes} min libres)
2. NE JAMAIS placer une tâche EN DEHORS des blocs de routine
3. NE JAMAIS chevaucher un événement existant
4. NE JAMAIS créer d'événements "Deep Work", "Emails" — place les VRAIES TÂCHES dans ces zones
5. Les heures de début/fin doivent être DANS les créneaux libres
6. 5 min de marge entre deux tâches dans le même bloc
7. GROUPAGE : tâches du même type consécutivement (réduit l'Attention Residue)
8. Les tâches haute priorité d'abord dans les blocs deep_work
9. Si aucune place dans le type de bloc optimal, utilise un bloc admin ou le créneau libre le plus proche

Réponds via l'outil plan_tasks. Pour chaque tâche, indique dans quel bloc de routine elle a été placée.`
          },
          {
            role: "user",
            content: `Date: ${today}
Capacité restante: ${maxCapacity} minutes

Tâches à placer (triées par priorité): ${JSON.stringify(correctedTasks)}

Événements RÉELS existants (à ne pas chevaucher): ${JSON.stringify(events?.map(e => ({ title: e.title, start: e.start_time, end: e.end_time })))}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "plan_tasks",
            description: "Place tasks in specific time slots within routine blocks",
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
                      block_type: { type: "string", enum: ["deep_work", "admin", "meetings", "email", "other"] },
                      routine_block_label: { type: "string", description: "Label of the routine block where this task was placed" },
                    },
                    required: ["task_id", "start_time", "end_time", "block_type", "routine_block_label"],
                    additionalProperties: false
                  }
                },
                capacity_used: { type: "number" },
                capacity_remaining: { type: "number" },
                skipped_count: { type: "number" },
                placement_summary: { type: "string", description: "Brief explanation of placement strategy" },
              },
              required: ["planned", "capacity_used", "capacity_remaining", "skipped_count", "placement_summary"],
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
    const { planned, capacity_used, capacity_remaining, skipped_count, placement_summary } = result;

    // Create calendar events for placed tasks
    for (const item of planned) {
      const task = tasks?.find(t => t.id === item.task_id);
      if (!task) continue;

      const colorMap: Record<string, string> = {
        deep_work: "#6366F1",
        admin: "#8B5CF6",
        meetings: "#A78BFA",
        email: "#3B82F6",
        other: "#64748B",
      };

      await supabase.from("calendar_events").insert({
        title: task.action_label,
        start_time: item.start_time,
        end_time: item.end_time,
        structure_id: task.structure_id,
        source: "ai",
        color: colorMap[item.block_type] || "#A78BFA",
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
      routine_used: routineName,
      routine_type: routineType,
      placement_summary,
      blocks_info: blockSlots.map(b => ({ label: b.label, type: b.type, freeMinutes: b.freeMinutes })),
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
