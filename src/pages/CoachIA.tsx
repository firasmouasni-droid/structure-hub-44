import AppLayout from "@/components/layout/AppLayout";
import { Bot, Send, CheckSquare, Calendar, TrendingUp, Sparkles, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import { useGoals } from "@/hooks/useGoals";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useStructures } from "@/hooks/useStructures";
import { toast } from "sonner";

const quickActions = [
  { icon: <CheckSquare className="w-4 h-4" />, label: "Planifie ma journée" },
  { icon: <Calendar className="w-4 h-4" />, label: "Optimise mon planning" },
  { icon: <TrendingUp className="w-4 h-4" />, label: "Analyse ma semaine" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Découpe ce projet" },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-ia`;

const CoachIA = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Bonjour ! 👋 Je suis ton coach IA. Je peux t'aider à organiser ta journée, analyser ta productivité ou découper tes projets.\n\nQue veux-tu faire ?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const { data: allTasks = [] } = useTasks({ isInbox: false });
  const { data: inboxTasks = [] } = useTasks({ isInbox: true });
  const { data: stats } = useUserStats();
  const { data: goals = [] } = useGoals();
  const { data: events = [] } = useCalendarEvents(today);
  const { data: structures = [] } = useStructures();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const todayTasks = allTasks.filter(t => t.due_date === today);
    const doneTasks = todayTasks.filter(t => t.status === "done");
    const highPriority = allTasks.filter(t => t.priority === "high" && t.status !== "done");
    return {
      today,
      tasks: { total: allTasks.length, todayTotal: todayTasks.length, todayDone: doneTasks.length, highPriority: highPriority.length, unplanned: allTasks.filter(t => !t.due_date && t.status !== "done").length },
      inbox: { pending: inboxTasks.length },
      stats: stats ? { xp: stats.xp, level: stats.level, streak: stats.streak_days } : null,
      goals: goals.slice(0, 5).map(g => ({ title: g.title, progress: g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0 })),
      events: events.length,
      structures: structures.map(s => ({ name: s.name, tasks: allTasks.filter(t => t.structure_id === s.id && t.status !== "done").length })),
    };
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(COACH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext(),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erreur" }));
        toast.error(err.error || "Erreur du coach IA");
        setIsLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de connexion au coach IA");
    }
    setIsLoading(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <motion.div className="border-b border-border/30 bg-card/80 backdrop-blur-sm px-6 py-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <motion.div className="w-12 h-12 rounded-3xl gradient-warm flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}>
              <Bot className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Coach IA 🤖</h1>
              <p className="text-xs text-muted-foreground">Assistant de productivité intelligent</p>
            </div>
          </div>
        </motion.div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-2xl gradient-warm flex items-center justify-center mr-3 mt-1 shrink-0 shadow-soft">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-3xl px-5 py-3.5 text-sm leading-relaxed ${msg.role === "user" ? "gradient-primary text-primary-foreground shadow-soft rounded-br-lg" : "bg-card/90 border border-border/30 text-foreground shadow-soft rounded-bl-lg"}`}>
                    <div className="whitespace-pre-line">{msg.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div className="flex justify-start" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-8 h-8 rounded-2xl gradient-warm flex items-center justify-center mr-3 mt-1 shrink-0 shadow-soft">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-card/90 border border-border/30 rounded-3xl rounded-bl-lg px-5 py-3.5 text-sm text-muted-foreground shadow-soft">
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>Réflexion en cours...</motion.span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div className="px-6 pb-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
            {quickActions.map((action, i) => (
              <motion.button key={i} onClick={() => sendMessage(action.label)} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="pill flex items-center gap-2 px-4 py-2 bg-card/80 border border-border/40 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shadow-soft">
                {action.icon}{action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div className="border-t border-border/30 bg-card/80 backdrop-blur-sm p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="max-w-4xl mx-auto flex gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Demande à ton coach IA..." className="flex-1 px-5 py-3.5 rounded-2xl border border-border bg-card/90 text-sm text-foreground placeholder:text-muted-foreground shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300" />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3.5 rounded-2xl bg-muted text-muted-foreground hover:text-foreground transition-all">
              <Mic className="w-5 h-5" />
            </motion.button>
            <motion.button onClick={() => sendMessage()} disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-5 py-3.5 rounded-2xl gradient-primary text-primary-foreground shadow-soft hover:shadow-soft-lg transition-all">
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default CoachIA;
