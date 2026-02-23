import AppLayout from "@/components/layout/AppLayout";
import { Bot, Send, CheckSquare, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";

const quickActions = [
  { icon: <CheckSquare className="w-3.5 h-3.5" />, label: "Planifie ma journée" },
  { icon: <Calendar className="w-3.5 h-3.5" />, label: "Optimise mon planning" },
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Analyse ma semaine" },
  { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Découpe ce projet en tâches" },
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// TODO: Connect to real AI API
async function callCoachAPI(messages: ChatMessage[], _structureId?: string): Promise<string> {
  return "Je vais analyser ton planning et tes tâches... 🧠\n\nVoici ma suggestion :\n\n1. Concentre-toi sur les tâches haute priorité\n2. Bloque du temps de deep work le matin\n3. Regroupe les appels et emails l'après-midi\n\nVeux-tu que j'ajuste ?";
}

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
        <div className="border-b border-border bg-card px-6 py-3">
          <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <div>
              <h1 className="text-sm font-semibold text-foreground">Coach IA</h1>
              <p className="text-[11px] text-muted-foreground">Assistant de productivité intelligent</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-foreground border border-border"
                }`}>
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-accent border border-border rounded-lg px-4 py-2.5 text-sm text-muted-foreground">Réflexion en cours...</div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-2">
          <div className="max-w-4xl mx-auto flex gap-1.5 flex-wrap">
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => setInput(action.label)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                {action.icon}{action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Demande à ton coach IA..." className="flex-1 px-3.5 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={sendMessage} disabled={isLoading} className="px-3.5 py-2.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CoachIA;
