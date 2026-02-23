import AppLayout from "@/components/layout/AppLayout";
import { Bot, Send, CheckSquare, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";

const quickActions = [
  { icon: <CheckSquare className="w-4 h-4" />, label: "Planifie ma journée" },
  { icon: <Calendar className="w-4 h-4" />, label: "Optimise mon planning" },
  { icon: <TrendingUp className="w-4 h-4" />, label: "Analyse ma semaine" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Découpe ce projet" },
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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
        {/* Header */}
        <div className="border-b border-border/50 bg-white/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-2xl gradient-warm flex items-center justify-center shadow-soft">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Coach IA</h1>
              <p className="text-xs text-muted-foreground">Assistant de productivité intelligent</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-3xl px-5 py-3.5 text-sm ${
                  msg.role === "user"
                    ? "gradient-primary text-primary-foreground shadow-soft rounded-br-lg"
                    : "bg-white/90 border border-border/50 text-foreground shadow-soft rounded-bl-lg"
                }`}>
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/90 border border-border/50 rounded-3xl rounded-bl-lg px-5 py-3.5 text-sm text-muted-foreground shadow-soft">
                  Réflexion en cours...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-2">
          <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => setInput(action.label)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-soft">
                {action.icon}{action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border/50 bg-white/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Demande à ton coach IA..." className="flex-1 px-5 py-3 rounded-2xl border border-border bg-white/90 text-sm text-foreground placeholder:text-muted-foreground shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={sendMessage} disabled={isLoading} className="px-4 py-3 rounded-2xl gradient-primary text-primary-foreground shadow-soft hover:shadow-soft-lg transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CoachIA;
