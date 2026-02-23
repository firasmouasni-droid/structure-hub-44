import { useTasks, useUpdateTask, useWIPStatus, WIP_LIMITS } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Search, Brain, Scissors, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import FocusMode from "@/components/focus/FocusMode";
import { NextActionDialog, WIPWarningDialog } from "@/components/focus/ProductivityDialogs";
import CategorySelector from "@/components/planning/CategorySelector";
import { CATEGORIES, type TaskCategory } from "@/lib/categories";
import type { Task } from "@/hooks/useTasks";

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
  const wip = useWIPStatus();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterStructure, setFilterStructure] = useState("");
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [nextActionTaskId, setNextActionTaskId] = useState<string | null>(null);
  const [wipWarningOpen, setWipWarningOpen] = useState(false);
  const [refiningId, setRefiningId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  let filtered = tasks.filter(t => !t.is_inbox && !t.parent_task_id);
  if (activeTab === "today") filtered = filtered.filter(t => t.due_date === today);
  if (activeTab === "important") filtered = filtered.filter(t => t.priority === "high");
  if (activeTab === "done") filtered = filtered.filter(t => t.status === "done");
  if (filterStructure) filtered = filtered.filter(t => t.structure_id === filterStructure);
  if (search) filtered = filtered.filter(t => t.action_label.toLowerCase().includes(search.toLowerCase()));

  const getSubtasks = (parentId: string) => tasks.filter(t => t.parent_task_id === parentId);

  const handleStatusChange = async (taskId: string, currentStatus: string, structureId: string) => {
    const next = currentStatus === "todo" ? "in_progress" : currentStatus === "in_progress" ? "done" : "todo";

    // WIP check when starting a task
    if (next === "in_progress" && !wip.canStartNew(structureId)) {
      setWipWarningOpen(true);
      return;
    }

    await updateTask.mutateAsync({ id: taskId, status: next });

    if (next === "done") {
      await incrementXP.mutateAsync(10);
      toast.success("+10 XP !");
    }

    // Ask for next action when pausing/completing
    if (currentStatus === "in_progress" && (next === "done" || next === "todo")) {
      setNextActionTaskId(taskId);
    }
  };

  const handleRefine = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setRefiningId(taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      const action = (task?.estimated_duration || 30) > 60 ? "both" : "refine";
      const { data, error } = await supabase.functions.invoke("task-refine", {
        body: { task_id: taskId, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const msg = data.subtasks_created > 0
        ? `Tâche découpée en ${data.subtasks_created} sous-tâches 🧩`
        : "Tâche reformulée par l'IA ✨";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      toast.error(err.message || "Erreur de refinement");
    }
    setRefiningId(null);
  };

  const handleStartFocus = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!wip.canStartNew(task.structure_id) && task.status !== "in_progress") {
      setWipWarningOpen(true);
      return;
    }
    if (task.status === "todo") {
      updateTask.mutateAsync({ id: task.id, status: "in_progress" });
    }
    setFocusTask(task);
  };

  const handleCategoryChange = async (taskId: string, category: TaskCategory) => {
    try {
      await supabase.from("tasks").update({ category }).eq("id", taskId);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Catégorie mise à jour : ${CATEGORIES[category].label}`);
    } catch {
      toast.error("Erreur lors du changement de catégorie");
    }
  };

  const inProgressTasks = tasks.filter(t => t.status === "in_progress");

  return (
    <PageTransition>
      {/* Focus Mode overlay */}
      {focusTask && (
        <FocusMode
          task={focusTask}
          onClose={() => {
            setFocusTask(null);
            setNextActionTaskId(focusTask.id);
          }}
          onComplete={() => setFocusTask(null)}
          onNextAction={(id) => {
            setFocusTask(null);
            setNextActionTaskId(id);
          }}
        />
      )}

      {/* Next Action Dialog */}
      <NextActionDialog
        open={!!nextActionTaskId}
        taskId={nextActionTaskId || ""}
        onClose={() => setNextActionTaskId(null)}
        onSave={async (action) => {
          if (nextActionTaskId) {
            await updateTask.mutateAsync({ id: nextActionTaskId, next_action: action });
            toast.success("Prochaine action enregistrée !");
          }
        }}
      />

      {/* WIP Warning */}
      <WIPWarningDialog
        open={wipWarningOpen}
        onClose={() => setWipWarningOpen(false)}
        inProgressTasks={inProgressTasks}
        onPauseTask={async (id) => {
          await updateTask.mutateAsync({ id, status: "todo" });
          toast.success("Tâche mise en pause");
        }}
      />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Toutes les tâches</h1>
          {wip.globalExceeded && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-warning/15 border border-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs font-bold text-warning-foreground">WIP: {wip.globalWIP}/{WIP_LIMITS.global}</span>
            </div>
          )}
        </div>

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
            const subtasks = getSubtasks(task.id);
            const needsSplit = (task.estimated_duration || 30) > 60 && !task.is_refined;
            return (
              <StaggerItem key={task.id}>
                <HoverCard className="card-soft p-4">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleStatusChange(task.id, task.status, task.structure_id)}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === "done" ? "border-success bg-success" : task.status === "in_progress" ? "border-primary bg-primary/20" : "border-border hover:border-primary"}`}>
                      {task.status === "done" && <span className="text-white text-xs font-bold">✓</span>}
                      {task.status === "in_progress" && <span className="text-primary text-xs">▶</span>}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${struct?.color || 'bg-muted'} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.action_label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {struct?.name || ''} · {task.due_date || 'Pas de date'}
                        {task.next_action && <span className="text-primary"> · ▸ {task.next_action}</span>}
                      </p>
                    </div>

                    <span className={`pill text-[10px] font-bold px-2.5 py-1 shrink-0 ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                  </div>

                  {/* Action row — visible below on mobile */}
                  {task.status !== "done" && (
                    <div className="flex items-center gap-2 mt-2 ml-9 flex-wrap">
                      {needsSplit && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleRefine(e, task.id)}
                          disabled={refiningId === task.id}
                          className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center"
                          title="Découper (>60min)"
                        >
                          <Scissors className={`w-3.5 h-3.5 ${refiningId === task.id ? "animate-spin" : ""}`} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleStartFocus(e, task)}
                        className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                        title="Mode Focus"
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </motion.button>
                      <CategorySelector
                        value={((task as any).category as TaskCategory) || "admin"}
                        onChange={(cat) => handleCategoryChange(task.id, cat)}
                        compact
                      />
                    </div>
                  )}

                  {/* Subtasks */}
                  {subtasks.length > 0 && (
                    <div className="ml-10 mt-3 space-y-1.5 border-l-2 border-primary/20 pl-4">
                      {subtasks.map(sub => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-3 cursor-pointer py-1"
                          onClick={() => handleStatusChange(sub.id, sub.status, sub.structure_id)}
                        >
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

export default GlobalTasks;
