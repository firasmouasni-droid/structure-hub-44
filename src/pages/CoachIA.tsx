import AppLayout from "@/components/layout/AppLayout";
import { Bot, Send, Sparkles, CheckSquare, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";

const quickActions = [
  { icon: <CheckSquare className="w-4 h-4" />, label: "Planifie ma journée", color: "bg-primary/10 text-primary hover:bg-primary/20" },
  { icon: <Calendar className="w-4 h-4" />, label: "Optimise mon planning", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
  { icon: <TrendingUp className="w-4 h-4" />, label: "Analyse ma semaine", color: "bg-success/10 text-success hover:bg-success/20" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Découpe ce projet en tâches", color: "bg-warning/10 text-warning hover:bg-warning/20" },
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// TODO: Connect to real AI API
async function callCoachAPI(messages: ChatMessage[], _structureId?: string): Promise<string> {
  // Placeholder — will connect to edge function / AI gateway later
  return "Je vais analyser ton planning et tes tâches... 🧠\n\nVoici ma suggestion :\n\n1. Concentre-toi sur les tâches haute priorité\n2. Bloque du temps de deep work le matin\n3. Regroupe les appels et emails l'après-midi\n\nVeux-tu que j'ajuste ?";
}

const SYSTEM_PROMPT = "Tu es un coach de productivité intelligent. Tu analyses les tâches, le planning et la charge de travail de l'utilisateur pour lui donner des conseils personnalisés.";

const CoachIA = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Bonjour ! 👋 Je suis ton coach IA. Je peux t'aider à organiser ta journée, analyser ta productivité ou découper tes projets en tâches.\n\nQue veux-tu faire ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      const response = await callCoachAPI(newMessages);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie." }]);
    }
    setIsLoading(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-xl gradient-ai flex items-center justify-center glow-ai">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Coach IA</h1>
              <p className="text-xs text-muted-foreground">Assistant de productivité intelligent</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground card-shadow rounded-bl-md"
                }`}>
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground">Réflexion en cours...</div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-2">
          <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => setInput(action.label)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${action.color}`}>
                {action.icon}{action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Demande à ton coach IA..." className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={sendMessage} disabled={isLoading} className="px-4 py-3 rounded-xl gradient-ai text-primary-foreground hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CoachIA;
