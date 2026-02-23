import AppLayout from "@/components/layout/AppLayout";
import { Bot, Send, Sparkles, CheckSquare, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";

const quickActions = [
  { icon: <CheckSquare className="w-4 h-4" />, label: "Planifie ma journée", color: "bg-primary/10 text-primary hover:bg-primary/20" },
  { icon: <Calendar className="w-4 h-4" />, label: "Optimise mon planning", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
  { icon: <TrendingUp className="w-4 h-4" />, label: "Analyse ma semaine", color: "bg-success/10 text-success hover:bg-success/20" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Découpe ce projet en tâches", color: "bg-warning/10 text-warning hover:bg-warning/20" },
];

type Message = { role: "user" | "assistant"; content: string };

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Bonjour Alexandre ! 👋 Je suis ton coach IA. Voici ce que je remarque aujourd'hui :\n\n• Tu as **2 tâches urgentes** non assignées à un créneau\n• Ta charge Pro est à **85%** — attention à la surcharge\n• Tu tiens un **streak de 12 jours** 🔥\n\nVeux-tu que je t'aide à planifier ta journée ou analyser ta progression ?",
  },
];

const CoachIA = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content: input },
      {
        role: "assistant" as const,
        content: "Je vais analyser ton planning et tes tâches... 🧠\n\nVoici ma suggestion :\n\n1. **8h–10h** : Deep work sur le contrat fournisseur (priorité haute)\n2. **10h–10h15** : Répondre à l'email de Thomas\n3. **10h30–12h** : Réunion marketing\n4. **14h** : Call comptable (20 min)\n5. **14h30–16h30** : Side Project v2\n\nCela te convient ? Je peux ajuster si besoin.",
      },
    ]);
    setInput("");
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
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

        {/* Messages */}
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
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-2">
          <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.label)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${action.color}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Demande à ton coach IA..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-3 rounded-xl gradient-ai text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CoachIA;
