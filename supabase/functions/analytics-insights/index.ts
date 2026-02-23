import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch all tasks
    const { data: tasks = [] } = await sb.from("tasks").select("*");
    // Fetch all structures
    const { data: structures = [] } = await sb.from("structures").select("id, name, color");
    // Fetch estimation coefficients
    const { data: coefficients = [] } = await sb.from("estimation_coefficients").select("*");

    const allTasks = tasks || [];
    const doneTasks = allTasks.filter((t: any) => t.status === "done");
    const today = new Date().toISOString().split("T")[0];
    const todayTasks = allTasks.filter((t: any) => t.due_date === today);
    const todayDone = todayTasks.filter((t: any) => t.status === "done");

    // 1. Planning adherence rate
    const planningAdherence = todayTasks.length > 0
      ? Math.round((todayDone.length / todayTasks.length) * 100)
      : null;

    // 2. Estimated vs actual duration analysis
    const withBothDurations = doneTasks.filter((t: any) => t.estimated_duration && t.actual_duration);
    const estimationAccuracy = withBothDurations.length > 0
      ? withBothDurations.map((t: any) => ({
          action_type: t.action_type,
          estimated: t.estimated_duration,
          actual: t.actual_duration,
          ratio: t.actual_duration / t.estimated_duration,
        }))
      : [];

    // Average estimation ratio by action_type
    const ratioByType: Record<string, { total: number; count: number }> = {};
    for (const item of estimationAccuracy) {
      if (!ratioByType[item.action_type]) ratioByType[item.action_type] = { total: 0, count: 0 };
      ratioByType[item.action_type].total += item.ratio;
      ratioByType[item.action_type].count += 1;
    }
    const avgRatioByType = Object.entries(ratioByType).map(([type, v]) => ({
      action_type: type,
      avg_ratio: Math.round((v.total / v.count) * 100) / 100,
      sample_count: v.count,
    }));

    // 3. Load per structure
    const loadByStructure = (structures || []).map((s: any) => {
      const sTasks = allTasks.filter((t: any) => t.structure_id === s.id);
      const sDone = sTasks.filter((t: any) => t.status === "done").length;
      const sInProgress = sTasks.filter((t: any) => t.status === "in_progress").length;
      const sTodo = sTasks.filter((t: any) => t.status === "todo").length;
      const totalMinutes = sTasks.reduce((sum: number, t: any) => sum + (t.estimated_duration || 0), 0);
      return { id: s.id, name: s.name, color: s.color, total: sTasks.length, done: sDone, in_progress: sInProgress, todo: sTodo, total_minutes: totalMinutes };
    });

    // 4. Recurring poorly-estimated tasks
    const poorlyEstimated = avgRatioByType.filter(r => r.avg_ratio > 1.4 || r.avg_ratio < 0.6);

    // 5. Overloaded days (last 14 days)
    const dayLoads: Record<string, number> = {};
    for (const t of allTasks) {
      if (t.due_date) {
        dayLoads[t.due_date] = (dayLoads[t.due_date] || 0) + (t.estimated_duration || 30);
      }
    }
    const overloadedDays = Object.entries(dayLoads)
      .filter(([, minutes]) => minutes > 480) // > 8h
      .map(([date, minutes]) => ({ date, minutes, hours: Math.round(minutes / 60 * 10) / 10 }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // 6. Generate AI insights
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let insights: string[] = [];

    if (apiKey) {
      const prompt = `Tu es un coach productivité basé sur la science (Planning Fallacy, Attention Residue, Flow, Kanban).

Données :
- Taux de respect du planning aujourd'hui : ${planningAdherence !== null ? planningAdherence + '%' : 'N/A'}
- Tâches totales : ${allTasks.length}, complétées : ${doneTasks.length}
- Estimation vs réel par type : ${JSON.stringify(avgRatioByType)}
- Tâches mal estimées : ${JSON.stringify(poorlyEstimated)}
- Jours surchargés : ${JSON.stringify(overloadedDays)}
- Charge par structure : ${JSON.stringify(loadByStructure.map((s: any) => ({ name: s.name, todo: s.todo, in_progress: s.in_progress })))}
- Coefficients d'estimation actuels : ${JSON.stringify(coefficients)}

Génère exactement 3-5 insights actionnables et personnalisés. Chaque insight doit :
1. Citer une donnée précise
2. Référencer un principe scientifique
3. Proposer une action concrète

Réponds UNIQUEMENT en JSON : { "insights": ["insight1", "insight2", ...] }`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            stream: false,
          }),
        });
        const text = await response.text();
        // Handle both SSE streamed and JSON responses
        let raw = "";
        if (text.startsWith("data: ")) {
          // SSE format - collect all data chunks
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const chunk = JSON.parse(line.slice(6));
                raw += chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content || "";
              } catch {}
            }
          }
        } else {
          // Standard JSON response
          try {
            const result = JSON.parse(text);
            raw = result.choices?.[0]?.message?.content || "";
          } catch {}
        }
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          insights = parsed.insights || [];
        }
      } catch (e) { console.error("AI insights error:", e); }
    }

    return new Response(JSON.stringify({
      planning_adherence: planningAdherence,
      total_tasks: allTasks.length,
      completed_tasks: doneTasks.length,
      today_tasks: todayTasks.length,
      today_done: todayDone.length,
      estimation_by_type: avgRatioByType,
      poorly_estimated: poorlyEstimated,
      load_by_structure: loadByStructure,
      overloaded_days: overloadedDays,
      insights,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
