import AppLayout from "@/components/layout/AppLayout";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const TABS = [
  { key: "all", label: "Toutes" },
  { key: "today", label: "Aujourd'hui" },
  { key: "important", label: "Importantes" },
  { key: "done", label: "Terminées" },
];

const GlobalTasks = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: structures = [] } = useStructures();
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterStructure, setFilterStructure] = useState("");

  const today = new Date().toISOString().split("T")[0];
  let filtered = tasks.filter(t => !t.is_inbox);
  if (activeTab === "today") filtered = filtered.filter(t => t.due_date === today);
  if (activeTab === "important") filtered = filtered.filter(t => t.priority === "high");
  if (activeTab === "done") filtered = filtered.filter(t => t.status === "done");
  if (filterStructure) filtered = filtered.filter(t => t.structure_id === filterStructure);
  if (search) filtered = filtered.filter(t => t.action_label.toLowerCase().includes(search.toLowerCase()));

  const handleStatusChange = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "todo" ? "in_progress" : currentStatus === "in_progress" ? "done" : "todo";
    await updateTask.mutateAsync({ id: taskId, status: next });
    if (next === "done") { await incrementXP.mutateAsync(10); toast.success("+10 XP !"); }
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Toutes les tâches</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft">
              {TABS.map(tab => (
                <motion.button key={tab.key} onClick={() => setActiveTab(tab.key)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab.label}
                </motion.button>
              ))}
            </div>
            <select value={filterStructure} onChange={e => setFilterStructure(e.target.value)} className="px-4 py-2 rounded-2xl border border-border bg-card/70 text-sm">
              <option value="">Tous les espaces</option>
              {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex-1" />
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10 pr-4 py-2 rounded-2xl border border-border bg-card/70 text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <StaggerContainer className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
            {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune tâche ✨</p>}
            {filtered.map(task => {
              const struct = structures.find(s => s.id === task.structure_id);
              return (
                <StaggerItem key={task.id}>
                  <HoverCard className="card-soft p-4 cursor-pointer" onClick={() => handleStatusChange(task.id, task.status)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === "done" ? "border-success bg-success" : "border-border hover:border-primary"}`}>
                        {task.status === "done" && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${struct?.color || 'bg-muted'} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.action_label}</p>
                        <p className="text-[11px] text-muted-foreground">{struct?.name || ''} · {task.due_date || 'Pas de date'}</p>
                      </div>
                      <span className="pill text-[10px] font-semibold px-2.5 py-1 bg-muted text-muted-foreground hidden sm:inline">{task.action_type}</span>
                      <span className={`pill text-[10px] font-bold px-2.5 py-1 ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                    </div>
                  </HoverCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default GlobalTasks;
