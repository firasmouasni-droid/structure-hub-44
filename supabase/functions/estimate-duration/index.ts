import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { title, description, action_type, user_estimated_duration } = await req.json();
    if (!title) throw new Error("title required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

    // Get user's estimation coefficients
    const { data: coefficients } = await supabase.from("estimation_coefficients").select("*");
    const coeff = coefficients?.find(c => c.action_type === (action_type || "OTHER"));
    const userCoeff = coeff?.coefficient || 1.3;

    // Base default
    const baseDuration = DURATION_DEFAULTS[action_type || "OTHER"] || 30;

    // Use AI for smart estimation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Tu estimes la durée de tâches professionnelles en minutes. Réponds via l'outil.
Règles:
- Emails simples: 5-15 min
- Réponses complexes/rédaction: 20-30 min
- Admin/paperasse: 20-45 min
- Deep work (rédaction, code, analyse): 60-90 min
- Réunions: 30-60 min
- Tâches rapides: 5-20 min
- Projets complexes: indique la durée TOTALE puis suggère un découpage.`
          },
          {
            role: "user",
            content: `Estime la durée pour: "${title}"${description ? ` - ${description}` : ""}
Type: ${action_type || "OTHER"}
${user_estimated_duration ? `L'utilisateur estime: ${user_estimated_duration} min` : ""}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "estimate_duration",
            description: "Return estimated duration",
            parameters: {
              type: "object",
              properties: {
                estimated_duration_minutes: { type: "number" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                should_split: { type: "boolean", description: "true if task should be split into steps" },
                suggested_steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      duration_minutes: { type: "number" },
                    },
                    required: ["title", "duration_minutes"],
                    additionalProperties: false,
                  }
                },
                reasoning: { type: "string" },
              },
              required: ["estimated_duration_minutes", "confidence", "should_split", "suggested_steps", "reasoning"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "estimate_duration" } },
      }),
    });

    if (!response.ok) {
      // Fallback to rule-based
      const adjusted = user_estimated_duration
        ? Math.ceil(user_estimated_duration * userCoeff)
        : baseDuration;
      return new Response(JSON.stringify({
        estimated_duration_minutes: adjusted,
        confidence: "low",
        should_split: adjusted > 90,
        suggested_steps: [],
        reasoning: "Estimation par défaut (IA indisponible)",
        source: "fallback",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No estimation generated");

    const result = JSON.parse(toolCall.function.arguments);

    // Apply user coefficient if user provided estimate
    if (user_estimated_duration && userCoeff > 1.0) {
      const adjusted = Math.ceil(user_estimated_duration * userCoeff);
      if (adjusted > result.estimated_duration_minutes) {
        result.estimated_duration_minutes = adjusted;
        result.reasoning += ` (ajusté ×${userCoeff} d'après historique)`;
      }
    }

    return new Response(JSON.stringify({ ...result, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate-duration error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
