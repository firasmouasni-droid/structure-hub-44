import { useTasksByStructure, useCreateTask, useUpdateTask, useWIPStatus, WIP_LIMITS } from "@/hooks/useTasks";
import { useStructure } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Plus, Search, Brain, Scissors, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import FocusMode from "@/components/focus/FocusMode";
import { NextActionDialog, WIPWarningDialog } from "@/components/focus/ProductivityDialogs";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/hooks/useTasks";

const ACTION_TYPES = ["CALL", "EMAIL", "MEETING", "WRITE", "PLAN", "BUILD", "REVIEW", "LEARN", "ADMIN", "OTHER"];
const TABS = [
  { key: "all", label: "Toutes" },
  { key: "today", label: "Aujourd'hui" },
  { key: "important", label: "Importantes" },
  { key: "done", label: "Terminées" },
];

const StructureTasks = () => {
  const { id } = useParams<{ id: string }>();
  const { data: structure } = useStructure(id || "");
  const { data: tasks = [], isLoading } = useTasksByStructure(id || "");
  const { data: allTasks = [] } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();
  const wip = useWIPStatus();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ action_label: "", action_type: "OTHER", priority: "medium", due_date: "", estimated_duration: "", domain: "" });
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [nextActionTaskId, setNextActionTaskId] = useState<string | null>(null);
  const [wipWarningOpen, setWipWarningOpen] = useState(false);
  const [refiningId, setRefiningId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  let filtered = tasks.filter(t => !t.is_inbox && !t.parent_task_id);
  if (activeTab === "today") filtered = filtered.filter(t => t.due_date === today);
  if (activeTab === "important") filtered = filtered.filter(t => t.priority === "high");
  if (activeTab === "done") filtered = filtered.filter(t => t.status === "done");
  if (search) filtered = filtered.filter(t => t.action_label.toLowerCase().includes(search.toLowerCase()));

  const getSubtasks = (parentId: string) => tasks.filter(t => t.parent_task_id === parentId);

  const handleStatusChange = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "todo" ? "in_progress" : currentStatus === "in_progress" ? "done" : "todo";
    if (next === "in_progress" && !wip.canStartNew(id!)) {
      setWipWarningOpen(true);
      return;
    }
    await updateTask.mutateAsync({ id: taskId, status: next });
    if (next === "done") { await incrementXP.mutateAsync(10); toast.success("+10 XP !"); }
    if (currentStatus === "in_progress") setNextActionTaskId(taskId);
  };

  const handleCreate = async () => {
    if (!newTask.action_label) { toast.error("Remplis le titre"); return; }
    await createTask.mutateAsync({
      ...newTask,
      structure_id: id!,
      estimated_duration: newTask.estimated_duration ? parseInt(newTask.estimated_duration) : null,
      due_date: newTask.due_date || null,
      domain: newTask.domain || null,
    });
    setDialogOpen(false);
    setNewTask({ action_label: "", action_type: "OTHER", priority: "medium", due_date: "", estimated_duration: "", domain: "" });
    toast.success("Tâche créée !");
  };

  const handleRefine = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setRefiningId(taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      const action = (task?.estimated_duration || 30) > 60 ? "both" : "refine";
      const { data, error } = await supabase.functions.invoke("task-refine", { body: { task_id: taskId, action } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data.subtasks_created > 0 ? `Découpée en ${data.subtasks_created} sous-tâches 🧩` : "Reformulée ✨");
    } catch (err: any) { toast.error(err.message || "Erreur"); }
    setRefiningId(null);
  };

  const handleStartFocus = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!wip.canStartNew(id!) && task.status !== "in_progress") { setWipWarningOpen(true); return; }
    if (task.status === "todo") updateTask.mutateAsync({ id: task.id, status: "in_progress" });
    setFocusTask(task);
  };

  const completedCount = tasks.filter(t => t.status === "done").length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const structureWIP = wip.byStructure[id!] || 0;
  const inProgressTasks = allTasks.filter(t => t.status === "in_progress");

  return (
    <PageTransition>
      {focusTask && (
        <FocusMode task={focusTask} onClose={() => { setFocusTask(null); setNextActionTaskId(focusTask.id); }} onComplete={() => setFocusTask(null)} onNextAction={(tid) => { setFocusTask(null); setNextActionTaskId(tid); }} />
      )}
      <NextActionDialog open={!!nextActionTaskId} taskId={nextActionTaskId || ""} onClose={() => setNextActionTaskId(null)} onSave={async (action) => { if (nextActionTaskId) { await updateTask.mutateAsync({ id: nextActionTaskId, next_action: action }); toast.success("Prochaine action enregistrée !"); } }} />
      <WIPWarningDialog open={wipWarningOpen} onClose={() => setWipWarningOpen(false)} inProgressTasks={inProgressTasks} onPauseTask={async (tid) => { await updateTask.mutateAsync({ id: tid, status: "todo" }); toast.success("Mise en pause"); }} />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tâches</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{tasks.length} tâches · {completedCount} complétées</p>
          </div>
          <div className="flex items-center gap-3">
            {structureWIP > WIP_LIMITS.perStructure && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-warning/15 border border-warning/20">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-[11px] font-bold text-warning-foreground">WIP: {structureWIP}/{WIP_LIMITS.perStructure}</span>
              </div>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft">
                  <Plus className="w-4 h-4" /> Nouvelle tâche
                </motion.button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-border/50">
                <DialogHeader><DialogTitle className="text-lg font-bold">Nouvelle tâche</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <input placeholder="Titre de la tâche" value={newTask.action_label} onChange={e => setNewTask(p => ({ ...p, action_label: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input placeholder="Domaine (optionnel)" value={newTask.domain} onChange={e => setNewTask(p => ({ ...p, domain: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newTask.action_type} onChange={e => setNewTask(p => ({ ...p, action_type: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm">
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm">
                      <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" />
                    <input type="number" placeholder="Durée (min)" value={newTask.estimated_duration} onChange={e => setNewTask(p => ({ ...p, estimated_duration: e.target.value }))} className="px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" />
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={createTask.isPending} className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft">
                    {createTask.isPending ? "Création..." : "Créer"}
                  </motion.button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft">
            {TABS.map(tab => (
              <motion.button key={tab.key} onClick={() => setActiveTab(tab.key)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </motion.button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10 pr-4 py-2 rounded-2xl border border-border bg-card/70 text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {/* Progress */}
        <div className="card-soft p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">Progression</span>
              <span className="font-bold text-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-pill overflow-hidden">
              <motion.div className="h-full gradient-primary rounded-pill" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
          </div>
        </div>

        {/* Task Cards */}
        <StaggerContainer className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
          {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune tâche ✨</p>}
          {filtered.map((task) => {
            const subtasks = getSubtasks(task.id);
            const needsSplit = (task.estimated_duration || 30) > 60 && !task.is_refined;
            return (
              <StaggerItem key={task.id}>
                <HoverCard className="card-soft p-4">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleStatusChange(task.id, task.status)}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === "done" ? "border-success bg-success" : task.status === "in_progress" ? "border-primary bg-primary/20" : "border-border hover:border-primary"}`}>
                      {task.status === "done" && <span className="text-white text-xs font-bold">✓</span>}
                      {task.status === "in_progress" && <span className="text-primary text-xs">▶</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.action_label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {task.domain || ''}{task.domain ? ' · ' : ''}{task.estimated_duration ? `${task.estimated_duration} min` : '-'} · {task.due_date || 'Pas de date'}
                        {task.next_action && <span className="text-primary"> · ▸ {task.next_action}</span>}
                      </p>
                    </div>
                    {task.status !== "done" && (
                      <div className="flex items-center gap-1.5">
                        {needsSplit && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleRefine(e, task.id)} disabled={refiningId === task.id} className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center" title="Découper">
                            <Scissors className={`w-3.5 h-3.5 ${refiningId === task.id ? "animate-spin" : ""}`} />
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => handleStartFocus(e, task)} className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center" title="Mode Focus">
                          <Brain className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    )}
                    <span className="pill text-[10px] font-semibold px-2.5 py-1 bg-muted text-muted-foreground hidden sm:inline">{task.action_type}</span>
                    <span className={`pill text-[10px] font-bold px-2.5 py-1 ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                  </div>
                  {subtasks.length > 0 && (
                    <div className="ml-10 mt-3 space-y-1.5 border-l-2 border-primary/20 pl-4">
                      {subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 cursor-pointer py-1" onClick={() => handleStatusChange(sub.id, sub.status)}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${sub.status === "done" ? "border-success bg-success" : "border-border"}`}>
                            {sub.status === "done" && <span className="text-white text-[8px]">✓</span>}
                          </div>
                          <span className={`text-xs ${sub.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{sub.action_label}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{sub.estimated_duration}min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </HoverCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default StructureTasks;
