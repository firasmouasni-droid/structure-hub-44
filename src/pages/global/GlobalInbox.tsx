import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Sparkles, Check, Clock, X, Mail, Inbox } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion, AnimatePresence } from "framer-motion";

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "email", label: "📧 Emails" },
  { key: "crm", label: "📊 CRM" },
  { key: "ai", label: "🤖 IA" },
  { key: "manual", label: "✍️ Manuel" },
];

const GlobalInbox = () => {
  const { data: allTasks = [], isLoading } = useTasks({ isInbox: true });
  const { data: structures = [] } = useStructures();
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();
  const [filter, setFilter] = useState("all");

  let filtered = allTasks;
  if (filter !== "all") filtered = filtered.filter(t => t.source === filter);

  const handleAccept = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, is_inbox: false });
    await incrementXP.mutateAsync(5);
    toast.success("Tâche acceptée ! +5 XP");
  };

  const handlePlan = async (taskId: string) => {
    const today = new Date().toISOString().split("T")[0];
    await updateTask.mutateAsync({ id: taskId, is_inbox: false, due_date: today });
    toast.success("Tâche planifiée !");
  };

  const handleIgnore = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, status: "done", is_inbox: false });
    toast("Tâche ignorée");
  };

  const sourceIcon = (source: string) => {
    if (source === "email") return <Mail className="w-5 h-5 text-primary" />;
    return <Sparkles className="w-5 h-5 text-primary" />;
  };

  return (
    <PageTransition>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-3xl gradient-warm flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inbox IA globale ⚡</h1>
              <p className="text-sm text-muted-foreground">{allTasks.length} suggestions à traiter</p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft w-fit flex-wrap">
            {FILTERS.map(f => (
              <motion.button key={f.key} onClick={() => setFilter(f.key)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                {f.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            <StaggerContainer className="space-y-3" key={filter}>
              {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
              {!isLoading && filtered.length === 0 && (
                <StaggerItem>
                  <div className="card-soft p-10 text-center">
                    <Inbox className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                    <p className="text-lg font-bold text-foreground">Inbox vide 🎉</p>
                    <p className="text-sm text-muted-foreground mt-1">Toutes les suggestions ont été traitées</p>
                  </div>
                </StaggerItem>
              )}
              {filtered.map(task => {
                const struct = structures.find(s => s.id === task.structure_id);
                return (
                  <StaggerItem key={task.id}>
                    <HoverCard className="card-soft p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">{sourceIcon(task.source)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="pill text-[10px] font-bold px-2.5 py-0.5 bg-primary/15 text-primary uppercase">{task.source}</span>
                            {struct && <span className="pill text-[10px] font-semibold px-2 py-0.5 bg-muted text-muted-foreground">{struct.name}</span>}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">{task.action_label}</h3>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{task.due_date || 'Pas de date'}</span><span>·</span><span>{task.estimated_duration ? `${task.estimated_duration} min` : '-'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:shrink-0 flex-wrap">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAccept(task.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-success/15 text-success-foreground text-xs font-bold hover:bg-success/25 transition-all"><Check className="w-3.5 h-3.5" />Accepter</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handlePlan(task.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-accent/15 text-accent text-xs font-bold hover:bg-accent/25 transition-all"><Clock className="w-3.5 h-3.5" />Planifier</motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleIgnore(task.id)} className="p-2 rounded-2xl bg-muted text-muted-foreground hover:text-foreground transition-all"><X className="w-4 h-4" /></motion.button>
                      </div>
                    </HoverCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </AnimatePresence>
        </div>
    </PageTransition>
  );
};

export default GlobalInbox;
