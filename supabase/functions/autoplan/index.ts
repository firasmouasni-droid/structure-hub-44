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

    // 0. Get today's morning audit for adaptive planning
    const { data: auditData } = await supabase
      .from("daily_audits")
      .select("*")
      .eq("audit_date", today)
      .maybeSingle();

    // Compute adaptation rules from audit
    let adaptRules = {
      maxDeepWorkMin: 120,
      blockDurationMode: "normal" as "short" | "normal" | "long",
      capacityMultiplier: 1.0,
      priorityMode: "normal" as "impact" | "easy_first" | "normal" | "low_friction",
      planningNote: "",
    };

    if (auditData) {
      // Energy
      if (auditData.energy_level >= 4) { adaptRules.maxDeepWorkMin = 240; adaptRules.planningNote += "Énergie haute → deep work prolongé. "; }
      else if (auditData.energy_level <= 2) { adaptRules.maxDeepWorkMin = 60; adaptRules.planningNote += "Énergie basse → deep work limité à 1h. "; }

      // Mental clarity
      if (auditData.mental_clarity === "fog") { adaptRules.priorityMode = "easy_first"; adaptRules.planningNote += "Brume mentale → tâches simples d'abord. "; }
      else if (auditData.mental_clarity === "clear") { adaptRules.priorityMode = "impact"; adaptRules.planningNote += "Clarté → tâches importantes le matin. "; }

      // Mood
      if (auditData.mood === "stressed" || auditData.mood === "anxious") { adaptRules.capacityMultiplier = 0.7; adaptRules.priorityMode = "easy_first"; adaptRules.planningNote += "Stress → planning allégé. "; }
      else if (auditData.mood === "motivated") { adaptRules.priorityMode = "impact"; adaptRules.planningNote += "Motivé → impact max. "; }

      // Distraction
      if (auditData.distraction_level === "scattered" || auditData.distraction_level === "distracted") { adaptRules.blockDurationMode = "short"; adaptRules.planningNote += "Distrait → blocs Pomodoro courts. "; }
      else if (auditData.distraction_level === "focus") { adaptRules.blockDurationMode = "long"; adaptRules.planningNote += "Concentré → blocs longs. "; }

      // Objective
      if (auditData.day_objective === "productivity") { adaptRules.priorityMode = "impact"; }
      else if (auditData.day_objective === "recovery") { adaptRules.capacityMultiplier = 0.5; adaptRules.planningNote += "Récupération → 50% capacité. "; }
      else if (auditData.day_objective === "slow") { adaptRules.priorityMode = "low_friction"; adaptRules.planningNote += "Tranquille → next actions simples. "; }

      // Cognitive
      if (auditData.cognitive_availability === "<2h") { adaptRules.maxDeepWorkMin = Math.min(adaptRules.maxDeepWorkMin, 60); adaptRules.capacityMultiplier = Math.min(adaptRules.capacityMultiplier, 0.5); adaptRules.planningNote += "Dispo <2h → 1 tâche max. "; }
      else if (auditData.cognitive_availability === ">4h") { adaptRules.maxDeepWorkMin = Math.max(adaptRules.maxDeepWorkMin, 240); adaptRules.planningNote += "Dispo >4h → deep work renforcé. "; }
    }

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

    // 7. Apply 65% capacity rule × audit adaptation multiplier
    const baseCapacity = Math.floor(totalFreeMinutes * 0.65);
    const maxCapacity = Math.floor(baseCapacity * adaptRules.capacityMultiplier);

    // 8. Build the detailed prompt with block-aware placement rules + audit context
    const blockRulesText = blockSlots.map(b =>
      `- ${b.label} (${b.start}-${b.end}, type: ${b.type}) → ${b.freeMinutes} min libres. Créneaux: ${b.freeSlots.map(s => `${s.start}-${s.end}`).join(", ") || "AUCUN (entièrement occupé)"}`
    ).join("\n");

    const auditContext = auditData ? `
AUDIT MATINAL DE L'UTILISATEUR :
- Énergie physique: ${auditData.energy_level}/5
- Clarté mentale: ${auditData.mental_clarity}
- Humeur: ${auditData.mood}
- Concentration: ${auditData.distraction_level}
- Objectif: ${auditData.day_objective}
- Dispo cognitive: ${auditData.cognitive_availability}

ADAPTATIONS REQUISES :
- Deep work max: ${adaptRules.maxDeepWorkMin} minutes
- Mode blocs: ${adaptRules.blockDurationMode === "short" ? "COURTS (25 min Pomodoro)" : adaptRules.blockDurationMode === "long" ? "LONGS (60-90 min)" : "NORMAUX (45-60 min)"}
- Priorité: ${adaptRules.priorityMode === "impact" ? "Impact MAX d'abord" : adaptRules.priorityMode === "easy_first" ? "Tâches SIMPLES d'abord (admin, quick)" : adaptRules.priorityMode === "low_friction" ? "Next actions simples, faible friction" : "Normal"}
- Capacité ajustée: ${maxCapacity} min (${Math.round(adaptRules.capacityMultiplier * 100)}% de la normale)
- Note: ${adaptRules.planningNote}` : "";

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
            content: `Tu es un planificateur IA scientifique. Tu places des TÂCHES dans le calendrier en respectant les blocs de la routine active de l'utilisateur.

ROUTINE ACTIVE : "${routineName}" (type: ${routineType})

BLOCS DE LA ROUTINE (avec disponibilité réelle après événements existants) :
${blockRulesText}

${taskTypeMapping}
${auditContext}

HORAIRES DE TRAVAIL STRICTS (NE JAMAIS placer en dehors) :
${WORK_BLOCKS.map(b => `- ${b.start}–${b.end}`).join("\n")}
- PAUSE DÉJEUNER : 12:00–13:00 (aucune tâche ne doit être dans cette plage)
- Toute tâche DOIT commencer ET finir ENTIÈREMENT dans l'une de ces plages

RÈGLES CRITIQUES :
1. CAPACITÉ MAX: ${maxCapacity} minutes (65% de ${totalFreeMinutes} min libres)
2. NE JAMAIS chevaucher un événement existant
3. NE JAMAIS créer d'événements "Deep Work", "Emails" — place les VRAIES TÂCHES dans ces zones
4. Les heures de début/fin doivent être DANS les créneaux libres et ALIGNÉES sur des intervalles de 15 minutes
5. COMPACTAGE : colle les tâches les unes aux autres sans trous ! La tâche suivante commence dès que la précédente finit (avec 0 min de marge dans le même bloc)
6. REMPLISSAGE CHRONOLOGIQUE : remplis les créneaux dans l'ordre chronologique, du plus tôt au plus tard
7. GROUPAGE : tâches du même type consécutivement (réduit l'Attention Residue)
8. Les tâches haute priorité d'abord dans les blocs deep_work
9. Les routines sont des PRÉFÉRENCES de placement, pas des blocages. Si un bloc deep_work est plein, place la tâche dans le créneau libre le plus proche, même s'il est de type admin
10. AUCUN trou entre deux tâches adjacentes dans le même bloc — elles doivent être collées bout à bout
11. Les seuls espaces vides autorisés sont les pauses de routine (type "break")
12. AUCUNE tâche avant 09:00 ou après 18:00
13. AUCUNE tâche pendant la pause 12:00–13:00
14. Si une tâche ne rentre pas entièrement dans un bloc libre, la reporter (skipped)

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

    const { planned, capacity_used, capacity_remaining, skipped_count, placement_summary } = result;
    let actuallyPlanned = 0;

    // Work hours config (must match frontend)
    const WORK_BLOCKS_CONFIG = [
      { startHour: 9, startMin: 0, endHour: 12, endMin: 0 },
      { startHour: 13, startMin: 0, endHour: 18, endMin: 0 },
    ];

    function isWithinWorkHoursServer(startIso: string, endIso: string): boolean {
      const s = new Date(startIso);
      const e = new Date(endIso);
      const sMin = s.getHours() * 60 + s.getMinutes();
      const eMin = e.getHours() * 60 + e.getMinutes();
      return WORK_BLOCKS_CONFIG.some(b => {
        const bStart = b.startHour * 60 + b.startMin;
        const bEnd = b.endHour * 60 + b.endMin;
        return sMin >= bStart && eMin <= bEnd;
      });
    }

    function hasCollisionServer(startIso: string, endIso: string, allEvents: { start_time: string; end_time: string }[]): boolean {
      const sMin = (() => { const d = new Date(startIso); return d.getHours() * 60 + d.getMinutes(); })();
      const eMin = (() => { const d = new Date(endIso); return d.getHours() * 60 + d.getMinutes(); })();
      return allEvents.some(ev => {
        const evS = (() => { const d = new Date(ev.start_time); return d.getHours() * 60 + d.getMinutes(); })();
        const evE = (() => { const d = new Date(ev.end_time); return d.getHours() * 60 + d.getMinutes(); })();
        return sMin < evE && eMin > evS;
      });
    }

    // Track all events (existing + newly created) for collision detection
    const allPlacedEvents: { start_time: string; end_time: string }[] = [...(events || [])];

    // Create calendar events for placed tasks — with server-side validation
    for (const item of planned) {
      const task = tasks?.find(t => t.id === item.task_id);
      if (!task) continue;

      // Validate work hours
      if (!isWithinWorkHoursServer(item.start_time, item.end_time)) {
        console.warn(`Skipping task "${task.action_label}": outside work hours`);
        continue;
      }

      // Validate no collision
      if (hasCollisionServer(item.start_time, item.end_time, allPlacedEvents)) {
        console.warn(`Skipping task "${task.action_label}": collision detected`);
        continue;
      }

      const colorMap: Record<string, string> = {
        deep_work: "#6366F1",
        admin: "#8B5CF6",
        meetings: "#A78BFA",
        email: "#3B82F6",
        other: "#64748B",
      };

      const categoryMap: Record<string, string> = {
        WRITE: "focus", BUILD: "focus", LEARN: "focus",
        MEETING: "meetings",
        ADMIN: "admin", PLAN: "admin", REVIEW: "admin",
        EMAIL: "communication", CALL: "communication",
      };
      const category = task.category || categoryMap[task.action_type] || "admin";

      await supabase.from("calendar_events").insert({
        title: task.action_label,
        start_time: item.start_time,
        end_time: item.end_time,
        structure_id: task.structure_id,
        source: "ai",
        color: colorMap[item.block_type] || "#A78BFA",
        category,
      });

      // Track this newly placed event for future collision checks
      allPlacedEvents.push({ start_time: item.start_time, end_time: item.end_time });

      await supabase.from("tasks").update({ due_date: today }).eq("id", task.id);
      actuallyPlanned++;
    }

    return new Response(JSON.stringify({
      planned: actuallyPlanned,
      items: planned,
      capacity_used,
      capacity_remaining,
      skipped_count: skipped_count + (planned.length - actuallyPlanned),
      max_capacity: maxCapacity,
      routine_used: routineName,
      routine_type: routineType,
      placement_summary,
      blocks_info: blockSlots.map(b => ({ label: b.label, type: b.type, freeMinutes: b.freeMinutes })),
      audit_applied: !!auditData,
      audit_note: adaptRules.planningNote || null,
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
