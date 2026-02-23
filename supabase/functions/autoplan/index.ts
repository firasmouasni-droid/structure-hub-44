import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──

function toMin(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minToStr(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function dayLabel(dateStr: string): string {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const d = new Date(dateStr + "T12:00:00Z");
  return `${days[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

interface FreeSlot {
  startMin: number;
  endMin: number;
}

interface DayCapacity {
  date: string;
  totalAvailable: number;
  maxSchedulable: number; // 70% of available
  usedMinutes: number;
  freeSlots: FreeSlot[];
}

/** Duration defaults by action_type */
const DURATION_DEFAULTS: Record<string, number> = {
  EMAIL: 15,
  CALL: 20,
  ADMIN: 30,
  OTHER: 30,
  PLAN: 45,
  REVIEW: 45,
  MEETING: 45,
  WRITE: 60,
  BUILD: 75,
  LEARN: 60,
};

/** Max single-session duration by type */
const MAX_SESSION: Record<string, number> = {
  EMAIL: 30,
  CALL: 45,
  ADMIN: 45,
  OTHER: 45,
  PLAN: 60,
  REVIEW: 60,
  MEETING: 90,
  WRITE: 90,
  BUILD: 90,
  LEARN: 75,
};

/** Preferred time-of-day: "morning" or "afternoon" or "any" */
const PREFERRED_TIME: Record<string, string> = {
  WRITE: "morning",
  BUILD: "morning",
  LEARN: "morning",
  REVIEW: "morning",
  EMAIL: "any",
  CALL: "any",
  ADMIN: "afternoon",
  PLAN: "morning",
  MEETING: "afternoon",
  OTHER: "any",
};

/** Compute free slots for a day given work hours and existing events */
function computeDayCapacity(
  dateStr: string,
  workStart: string, workEnd: string, pauseStart: string, pauseEnd: string,
  existingEvents: { start_time: string; end_time: string }[]
): DayCapacity {
  const wsMin = toMin(workStart);
  const weMin = toMin(workEnd);
  const psMin = toMin(pauseStart);
  const peMin = toMin(pauseEnd);

  // Work blocks: morning and afternoon
  const workBlocks: FreeSlot[] = [];
  if (wsMin < psMin) workBlocks.push({ startMin: wsMin, endMin: psMin });
  if (peMin < weMin) workBlocks.push({ startMin: peMin, endMin: weMin });

  // Get events for this specific day as minute ranges
  const dayEvents = existingEvents
    .filter(e => e.start_time.startsWith(dateStr))
    .map(e => {
      const s = new Date(e.start_time);
      const end = new Date(e.end_time);
      return { startMin: s.getUTCHours() * 60 + s.getUTCMinutes(), endMin: end.getUTCHours() * 60 + end.getUTCMinutes() };
    })
    .sort((a, b) => a.startMin - b.startMin);

  // Subtract events from work blocks to get free slots
  const freeSlots: FreeSlot[] = [];
  for (const block of workBlocks) {
    let cursor = block.startMin;
    for (const ev of dayEvents) {
      if (ev.endMin <= block.startMin || ev.startMin >= block.endMin) continue;
      const evStart = Math.max(ev.startMin, block.startMin);
      const evEnd = Math.min(ev.endMin, block.endMin);
      if (cursor < evStart) {
        freeSlots.push({ startMin: cursor, endMin: evStart });
      }
      cursor = Math.max(cursor, evEnd);
    }
    if (cursor < block.endMin) {
      freeSlots.push({ startMin: cursor, endMin: block.endMin });
    }
  }

  const totalAvailable = freeSlots.reduce((sum, s) => sum + (s.endMin - s.startMin), 0);
  const maxSchedulable = Math.floor(totalAvailable * 0.7);

  return { date: dateStr, totalAvailable, maxSchedulable, usedMinutes: 0, freeSlots };
}

/** Try to place a task of given duration into day capacity. Returns placed slot or null. */
function tryPlace(day: DayCapacity, durationMin: number, preferMorning: boolean, pauseStartMin: number): { startMin: number; endMin: number } | null {
  if (day.usedMinutes + durationMin > day.maxSchedulable) return null;

  // Sort slots: prefer morning or afternoon
  const sortedSlots = [...day.freeSlots];
  if (!preferMorning) {
    sortedSlots.sort((a, b) => b.startMin - a.startMin); // afternoon first
  }

  for (const slot of sortedSlots) {
    const available = slot.endMin - slot.startMin;
    if (available >= durationMin) {
      // Snap to 15-min
      const startMin = Math.ceil(slot.startMin / 15) * 15;
      const endMin = startMin + durationMin;
      if (endMin <= slot.endMin) {
        // Consume from slot
        const idx = day.freeSlots.indexOf(slot);
        if (idx !== -1) {
          day.freeSlots.splice(idx, 1);
          if (endMin < slot.endMin) {
            day.freeSlots.push({ startMin: endMin, endMin: slot.endMin });
          }
          if (slot.startMin < startMin) {
            day.freeSlots.push({ startMin: slot.startMin, endMin: startMin });
          }
          day.freeSlots.sort((a, b) => a.startMin - b.startMin);
        }
        day.usedMinutes += durationMin;
        return { startMin, endMin };
      }
    }
  }
  return null;
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
    const planningHorizonDays = body.horizon_days || 14; // 2 weeks default

    // ── 1. Work hours ──
    const { data: workHoursRow } = await supabase.from("work_hours_settings").select("*").limit(1).maybeSingle();
    const workStart = workHoursRow?.work_start || "09:00";
    const workEnd = workHoursRow?.work_end || "18:00";
    const pauseStart = workHoursRow?.pause_start || "12:00";
    const pauseEnd = workHoursRow?.pause_end || "13:00";
    const pauseStartMin = toMin(pauseStart);

    // ── 2. Morning audit for today ──
    const { data: auditData } = await supabase.from("daily_audits").select("*").eq("audit_date", today).maybeSingle();
    let capacityMultiplier = 1.0;
    let auditNote = "";
    if (auditData) {
      if (auditData.energy_level <= 2) { capacityMultiplier = 0.6; auditNote += "Énergie basse → capacité réduite. "; }
      if (auditData.mood === "stressed" || auditData.mood === "anxious") { capacityMultiplier *= 0.7; auditNote += "Stress → planning allégé. "; }
      if (auditData.day_objective === "recovery") { capacityMultiplier *= 0.5; auditNote += "Récupération. "; }
      if (auditData.cognitive_availability === "<2h") { capacityMultiplier *= 0.5; auditNote += "Dispo <2h. "; }
    }

    // ── 3. Estimation coefficients ──
    const { data: coefficients } = await supabase.from("estimation_coefficients").select("*");
    const coeffMap: Record<string, number> = {};
    for (const c of coefficients || []) coeffMap[c.action_type] = c.coefficient;

    // ── 4. Unplanned tasks (no due_date, not done) ──
    let taskQuery = supabase.from("tasks").select("*").is("due_date", null).neq("status", "done").order("computed_priority", { ascending: false }).limit(50);
    if (structureFilter) taskQuery = taskQuery.eq("structure_id", structureFilter);
    const { data: rawTasks } = await taskQuery;
    const tasks = rawTasks || [];

    // ── 5. Get all events for the planning horizon ──
    const horizonEnd = addDays(today, planningHorizonDays);
    const { data: allEvents } = await supabase.from("calendar_events").select("*")
      .gte("start_time", `${today}T00:00:00`).lte("start_time", `${horizonEnd}T23:59:59`);

    // ── 6. Compute per-day capacity ──
    const dayCapacities: DayCapacity[] = [];
    for (let i = 0; i < planningHorizonDays; i++) {
      const dateStr = addDays(today, i);
      if (isWeekend(dateStr)) continue; // skip weekends
      const cap = computeDayCapacity(dateStr, workStart, workEnd, pauseStart, pauseEnd, allEvents || []);
      // Apply audit multiplier only for today
      if (i === 0 && capacityMultiplier < 1.0) {
        cap.maxSchedulable = Math.floor(cap.maxSchedulable * capacityMultiplier);
      }
      dayCapacities.push(cap);
    }

    // ── 7. Estimate durations & split big tasks using AI ──
    // Prepare tasks with corrected durations
    interface PreparedTask {
      id: string;
      label: string;
      actionType: string;
      priority: string;
      importance: number;
      urgency: number;
      computedPriority: number | null;
      durationMin: number;
      structureId: string;
      category: string;
      isSubtask: boolean;
      parentLabel?: string;
      stepOrder?: number;
      dueDate?: string | null;
    }

    const tasksToSchedule: PreparedTask[] = [];

    for (const t of tasks) {
      const coeff = coeffMap[t.action_type] || 1.3;
      const rawDuration = t.estimated_duration || DURATION_DEFAULTS[t.action_type] || 30;
      const correctedDuration = Math.ceil(rawDuration * coeff);
      const maxSession = MAX_SESSION[t.action_type] || 90;

      if (correctedDuration > maxSession) {
        // Split into multiple sessions
        const sessionCount = Math.ceil(correctedDuration / maxSession);
        const sessionDuration = Math.ceil(correctedDuration / sessionCount / 15) * 15; // round to 15
        for (let s = 0; s < sessionCount; s++) {
          const remaining = correctedDuration - s * sessionDuration;
          const thisDuration = Math.min(sessionDuration, remaining);
          tasksToSchedule.push({
            id: t.id,
            label: sessionCount > 1 ? `${t.action_label} (${s + 1}/${sessionCount})` : t.action_label,
            actionType: t.action_type,
            priority: t.priority,
            importance: t.importance,
            urgency: t.urgency,
            computedPriority: t.computed_priority,
            durationMin: Math.max(thisDuration, 15),
            structureId: t.structure_id,
            category: t.category || "admin",
            isSubtask: sessionCount > 1,
            parentLabel: sessionCount > 1 ? t.action_label : undefined,
            stepOrder: s + 1,
            dueDate: t.due_date,
          });
        }
      } else {
        tasksToSchedule.push({
          id: t.id,
          label: t.action_label,
          actionType: t.action_type,
          priority: t.priority,
          importance: t.importance,
          urgency: t.urgency,
          computedPriority: t.computed_priority,
          durationMin: Math.max(Math.ceil(correctedDuration / 15) * 15, 15),
          structureId: t.structure_id,
          category: t.category || "admin",
          isSubtask: false,
          dueDate: t.due_date,
        });
      }
    }

    // ── 8. Sort tasks by scheduling priority ──
    // Urgencies first → high priority → high importance → short tasks last (fill gaps)
    tasksToSchedule.sort((a, b) => {
      // Step order: keep steps of same task together
      if (a.id === b.id && a.isSubtask && b.isSubtask) return (a.stepOrder || 0) - (b.stepOrder || 0);
      // Priority: high > medium > low
      const prioOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const pa = prioOrder[a.priority] ?? 1;
      const pb = prioOrder[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      // Importance desc
      if (b.importance !== a.importance) return b.importance - a.importance;
      // Urgency desc
      return b.urgency - a.urgency;
    });

    // ── 9. Place tasks across days ──
    const placements: {
      taskId: string;
      label: string;
      date: string;
      startTime: string;
      endTime: string;
      durationMin: number;
      category: string;
      structureId: string;
    }[] = [];

    const atRiskTasks: { label: string; reason: string }[] = [];
    const skippedTasks: { label: string; reason: string }[] = [];
    const placedTaskIds = new Set<string>();

    // Group steps of same task so they go on consecutive days
    let prevTaskId = "";
    let dayIndexForSteps = 0;

    for (const task of tasksToSchedule) {
      const preferMorning = PREFERRED_TIME[task.actionType] === "morning" || task.importance >= 4;
      let placed = false;

      // For multi-step tasks, try to spread across different days
      const startDayIdx = (task.isSubtask && task.id === prevTaskId) ? Math.min(dayIndexForSteps + 1, dayCapacities.length - 1) : 0;

      for (let di = startDayIdx; di < dayCapacities.length; di++) {
        const day = dayCapacities[di];
        const slot = tryPlace(day, task.durationMin, preferMorning, pauseStartMin);
        if (slot) {
          const startIso = `${day.date}T${minToStr(slot.startMin)}:00Z`;
          const endIso = `${day.date}T${minToStr(slot.endMin)}:00Z`;

          placements.push({
            taskId: task.id,
            label: task.label,
            date: day.date,
            startTime: startIso,
            endTime: endIso,
            durationMin: task.durationMin,
            category: task.category,
            structureId: task.structureId,
          });
          placedTaskIds.add(task.id);
          placed = true;
          prevTaskId = task.id;
          dayIndexForSteps = di;
          break;
        }
      }

      if (!placed) {
        if (task.priority === "high") {
          atRiskTasks.push({ label: task.label, reason: "Pas assez de capacité dans les 2 prochaines semaines" });
        } else {
          skippedTasks.push({ label: task.label, reason: "Capacité insuffisante, reportée" });
        }
      }
    }

    // ── 10. Write to database ──
    let actuallyPlanned = 0;
    const plannedDates = new Set<string>();

    for (const p of placements) {
      const { error } = await supabase.from("calendar_events").insert({
        title: p.label,
        start_time: p.startTime,
        end_time: p.endTime,
        structure_id: p.structureId,
        source: "ai",
        category: p.category,
        color: null,
      });

      if (error) {
        console.error("Insert error:", error);
        continue;
      }

      // Update task due_date to the first day it's scheduled
      await supabase.from("tasks").update({ due_date: p.date }).eq("id", p.taskId);

      actuallyPlanned++;
      plannedDates.add(p.date);
    }

    // ── 11. Build summary ──
    const daysSummary = dayCapacities.slice(0, 10).map(d => {
      const dayPlacements = placements.filter(p => p.date === d.date);
      const totalPlanned = dayPlacements.reduce((s, p) => s + p.durationMin, 0);
      return `${dayLabel(d.date)}: ${totalPlanned}/${d.maxSchedulable} min (${dayPlacements.length} tâches)`;
    }).join("\n");

    const overloadWarning = atRiskTasks.length > 0
      ? `⚠️ ${atRiskTasks.length} tâche(s) prioritaire(s) n'ont pas pu être placées par manque de capacité.`
      : null;

    const placementSummary = [
      `Planning réparti sur ${plannedDates.size} jour(s).`,
      daysSummary,
      overloadWarning,
      skippedTasks.length > 0 ? `${skippedTasks.length} tâche(s) reportée(s) (capacité insuffisante).` : null,
    ].filter(Boolean).join("\n");

    return new Response(JSON.stringify({
      planned: actuallyPlanned,
      planned_dates: Array.from(plannedDates).sort(),
      skipped_count: skippedTasks.length,
      at_risk: atRiskTasks,
      skipped: skippedTasks,
      placement_summary: placementSummary,
      overload_warning: overloadWarning,
      days_breakdown: dayCapacities.slice(0, 10).map(d => ({
        date: d.date,
        label: dayLabel(d.date),
        available: d.totalAvailable,
        max: d.maxSchedulable,
        used: d.usedMinutes,
        tasks: placements.filter(p => p.date === d.date).map(p => ({ label: p.label, duration: p.durationMin })),
      })),
      audit_applied: !!auditData,
      audit_note: auditNote || null,
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
