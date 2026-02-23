import AppLayout from "@/components/layout/AppLayout";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const ACTION_TYPES = ["CALL", "EMAIL", "MEETING", "WRITE", "PLAN", "BUILD", "REVIEW", "LEARN", "ADMIN", "OTHER"];

const TABS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "important", label: "Important" },
  { key: "admin", label: "Admin" },
  { key: "clients", label: "Clients" },
];

const Tasks = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [structureFilter, setStructureFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: allTasks = [], isLoading } = useTasks({ isInbox: false });
  const { data: structures = [] } = useStructures();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();

  const [newTask, setNewTask] = useState({
    action_label: "", action_type: "OTHER", structure_id: "", priority: "medium", due_date: "", estimated_duration: "",
  });

  const today = new Date().toISOString().split("T")[0];
  let filtered = allTasks;
  if (activeTab === "today") filtered = filtered.filter(t => t.due_date === today);
  if (activeTab === "important") filtered = filtered.filter(t => t.priority === "high");
  if (activeTab === "admin") filtered = filtered.filter(t => t.action_type === "ADMIN");
  if (activeTab === "clients") filtered = filtered.filter(t => t.domain === "Client");
  if (structureFilter !== "all") filtered = filtered.filter(t => t.structure_id === structureFilter);
  if (search) filtered = filtered.filter(t => t.action_label.toLowerCase().includes(search.toLowerCase()));

  const handleStatusChange = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "todo" ? "in_progress" : currentStatus === "in_progress" ? "done" : "todo";
    await updateTask.mutateAsync({ id: taskId, status: next });
    if (next === "done") {
      await incrementXP.mutateAsync(10);
      toast.success("+10 XP !");
    }
  };

  const handleCreate = async () => {
    if (!newTask.action_label || !newTask.structure_id) { toast.error("Remplis le titre et la structure"); return; }
    await createTask.mutateAsync({
      ...newTask,
      estimated_duration: newTask.estimated_duration ? parseInt(newTask.estimated_duration) : null,
      due_date: newTask.due_date || null,
    });
    setDialogOpen(false);
    setNewTask({ action_label: "", action_type: "OTHER", structure_id: "", priority: "medium", due_date: "", estimated_duration: "" });
    toast.success("Tâche créée !");
  };

  const completedCount = allTasks.filter(t => t.status === "done").length;
  const progressPct = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Center</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{allTasks.length} tâches · {completedCount} complétées</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft hover:shadow-soft-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Task
                </motion.button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-border/50">
                <DialogHeader><DialogTitle className="text-lg font-bold">Nouvelle tâche</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <input placeholder="Titre de la tâche" value={newTask.action_label} onChange={e => setNewTask(p => ({ ...p, action_label: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300" />
                  <select value={newTask.structure_id} onChange={e => setNewTask(p => ({ ...p, structure_id: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm transition-colors duration-300">
                    <option value="">Structure...</option>
                    {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newTask.action_type} onChange={e => setNewTask(p => ({ ...p, action_type: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm transition-colors duration-300">
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm transition-colors duration-300">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm transition-colors duration-300" />
                    <input type="number" placeholder="Durée (min)" value={newTask.estimated_duration} onChange={e => setNewTask(p => ({ ...p, estimated_duration: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm transition-colors duration-300" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={createTask.isPending}
                    className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft"
                  >
                    {createTask.isPending ? "Création..." : "Créer la tâche"}
                  </motion.button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft">
              {TABS.map(tab => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>
            <select value={structureFilter} onChange={e => setStructureFilter(e.target.value)} className="px-4 py-2 rounded-2xl border border-border bg-card/70 text-sm shadow-soft transition-colors duration-300">
              <option value="all">Toutes structures</option>
              {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex-1" />
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10 pr-4 py-2 rounded-2xl border border-border bg-card/70 text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300" />
            </div>
          </div>

          {/* Global progress */}
          <div className="card-soft p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">Progression globale</span>
                <span className="font-bold text-foreground">{progressPct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-pill overflow-hidden">
                <motion.div
                  className="h-full gradient-primary rounded-pill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Task Cards */}
          <StaggerContainer className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
            {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune tâche ✨</p>}
            {filtered.map((task) => {
              const structure = structures.find(s => s.id === task.structure_id);
              return (
                <StaggerItem key={task.id}>
                  <HoverCard
                    className="card-soft p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => handleStatusChange(task.id, task.status)}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === "done" ? "border-success bg-success" : "border-border hover:border-primary"}`}>
                      {task.status === "done" && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className={`w-8 h-8 rounded-xl ${structure?.color || 'bg-muted'} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{structure?.name?.charAt(0) || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.action_label}</p>
                      <p className="text-[11px] text-muted-foreground">{structure?.name} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'} · {task.due_date || 'Pas de date'}</p>
                    </div>
                    <span className="pill text-[10px] font-semibold px-2.5 py-1 bg-muted text-muted-foreground">{task.action_type}</span>
                    <span className={`pill text-[10px] font-bold px-2.5 py-1 ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                    <div className="w-12 h-1.5 bg-muted rounded-pill overflow-hidden shrink-0">
                      <div className={`h-full rounded-pill transition-all ${task.status === "done" ? "bg-success w-full" : task.status === "in_progress" ? "gradient-warm w-1/2" : "w-0"}`} />
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

export default Tasks;
