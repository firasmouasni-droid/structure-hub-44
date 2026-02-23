import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email_text, structure_id } = await req.json();
    if (!email_text) {
      return new Response(JSON.stringify({ error: "email_text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: "Tu es un assistant qui analyse des emails pour en extraire des tâches. Réponds uniquement via l'outil suggest_task."
          },
          { role: "user", content: `Analyse cet email et extrais la tâche principale:\n\n${email_text}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_task",
            description: "Extract a task from the email",
            parameters: {
              type: "object",
              properties: {
                action_label: { type: "string", description: "Titre clair de la tâche" },
                action_type: { type: "string", enum: ["CALL", "EMAIL", "MEETING", "WRITE", "PLAN", "BUILD", "REVIEW", "LEARN", "ADMIN", "OTHER"] },
                priority: { type: "string", enum: ["low", "medium", "high"] },
                domain: { type: "string", description: "Domaine (Client, Interne, etc.)" },
                due_date: { type: "string", description: "Date ISO YYYY-MM-DD si mentionnée, sinon null" },
                estimated_duration: { type: "number", description: "Durée estimée en minutes" },
              },
              required: ["action_label", "action_type", "priority"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_task" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No task extracted" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const taskData = JSON.parse(toolCall.function.arguments);
    const result = {
      ...taskData,
      structure_id: structure_id || null,
      source: "email",
      is_inbox: true,
      due_date: taskData.due_date || null,
      estimated_duration: taskData.estimated_duration || null,
      domain: taskData.domain || null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("email-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
