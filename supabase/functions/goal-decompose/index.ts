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
    const { goal_id } = await req.json();
    if (!goal_id) throw new Error("goal_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: goal, error: gErr } = await sb.from("goals").select("*").eq("id", goal_id).single();
    if (gErr || !goal) throw new Error("Goal not found");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const prompt = `Tu es un expert en Goal Setting (Locke & Latham) et MCII (Mental Contrasting with Implementation Intentions).

Objectif principal : "${goal.title}"
Description : "${goal.description || 'N/A'}"
KPI : "${goal.kpi || 'N/A'}" (unité: ${goal.kpi_unit || 'N/A'})
Valeur cible : ${goal.target_value || 'N/A'}
Échéance : ${goal.end_date || 'N/A'}
Critères de réussite : "${goal.success_criteria || 'N/A'}"

Applique la méthode MCII :
1. Mental Contrasting : identifie le résultat souhaité vs les obstacles
2. Implementation Intentions : crée des "si...alors" concrets

Décompose cet objectif en :
- 2-4 sous-objectifs mesurables (étapes intermédiaires)
- Pour chaque sous-objectif, 2-3 tâches concrètes et actionnables (< 60 min chacune)

Réponds UNIQUEMENT en JSON valide :
{
  "sub_goals": [
    {
      "title": "Sous-objectif spécifique et mesurable",
      "description": "Description avec obstacle identifié et intention d'implémentation",
      "target_value": number,
      "tasks": [
        { "action_label": "Action concrète (verbe + livrable + durée)", "action_type": "WRITE|CALL|REVIEW|BUILD|PLAN|LEARN|ADMIN|OTHER", "estimated_duration": number_minutes }
      ]
    }
  ]
}`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    const parsed = JSON.parse(jsonMatch[0]);

    let subGoalsCreated = 0;
    let tasksCreated = 0;

    for (const sg of parsed.sub_goals || []) {
      const { data: newGoal, error: sgErr } = await sb.from("goals").insert({
        structure_id: goal.structure_id,
        title: sg.title,
        description: sg.description,
        target_value: sg.target_value || null,
        period: goal.period,
        end_date: goal.end_date,
        parent_goal_id: goal.id,
        kpi: goal.kpi,
        kpi_unit: goal.kpi_unit,
        difficulty: "medium",
        status: "active",
      }).select().single();

      if (sgErr) { console.error("Sub-goal insert error:", sgErr); continue; }
      subGoalsCreated++;

      for (const task of sg.tasks || []) {
        const { error: tErr } = await sb.from("tasks").insert({
          structure_id: goal.structure_id,
          action_label: task.action_label,
          action_type: task.action_type || "OTHER",
          estimated_duration: task.estimated_duration || 30,
          importance: 4,
          urgency: 2,
          source: "ia",
        });
        if (tErr) console.error("Task insert error:", tErr);
        else tasksCreated++;
      }
    }

    return new Response(JSON.stringify({ sub_goals_created: subGoalsCreated, tasks_created: tasksCreated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
