import AppLayout from "@/components/layout/AppLayout";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Plus, Filter, Search, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const actionTypeColors: Record<string, string> = {
  CALL: "bg-warning/10 text-warning",
  EMAIL: "bg-primary/10 text-primary",
  MEETING: "bg-secondary/10 text-secondary",
  WRITE: "bg-success/10 text-success",
  PLAN: "bg-primary/10 text-primary",
  BUILD: "bg-secondary/10 text-secondary",
  REVIEW: "bg-warning/10 text-warning",
  LEARN: "bg-success/10 text-success",
  ADMIN: "bg-muted text-muted-foreground",
  OTHER: "bg-muted text-muted-foreground",
};

const ACTION_TYPES = ["CALL", "EMAIL", "MEETING", "WRITE", "PLAN", "BUILD", "REVIEW", "LEARN", "ADMIN", "OTHER"];

const Tasks = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [structureFilter, setStructureFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: allTasks = [], isLoading } = useTasks({ isInbox: false });
  const { data: structures = [] } = useStructures();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();

  // New task form state
  const [newTask, setNewTask] = useState({
    action_label: "", action_type: "OTHER", structure_id: "", priority: "medium", due_date: "", estimated_duration: "",
  });

  let filtered = allTasks;
  if (statusFilter !== "all") filtered = filtered.filter(t => t.status === statusFilter);
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

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Tâches</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle tâche</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <input placeholder="Titre de la tâche" value={newTask.action_label} onChange={e => setNewTask(p => ({ ...p, action_label: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                <select value={newTask.structure_id} onChange={e => setNewTask(p => ({ ...p, structure_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="">Structure...</option>
                  {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select value={newTask.action_type} onChange={e => setNewTask(p => ({ ...p, action_type: e.target.value }))} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                    {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                  <input type="number" placeholder="Durée (min)" value={newTask.estimated_duration} onChange={e => setNewTask(p => ({ ...p, estimated_duration: e.target.value }))} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </div>
                <button onClick={handleCreate} disabled={createTask.isPending} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  {createTask.isPending ? "Création..." : "Créer"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            {[{ key: "all", label: "Toutes" }, { key: "todo", label: "À faire" }, { key: "in_progress", label: "En cours" }, { key: "done", label: "Terminées" }].map((f) => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={structureFilter} onChange={e => setStructureFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
            <option value="all">Toutes structures</option>
            {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {/* Task List */}
        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span></span><span>Tâche</span><span>Structure</span><span>Type</span><span>Priorité</span><span>Échéance</span>
          </div>
          <div className="divide-y divide-border">
            {isLoading && <p className="p-4 text-sm text-muted-foreground text-center">Chargement...</p>}
            {!isLoading && filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Aucune tâche</p>}
            {filtered.map((task) => {
              const structure = structures.find(s => s.id === task.structure_id);
              return (
                <div key={task.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleStatusChange(task.id, task.status)}>
                  <input type="checkbox" className="w-4 h-4 rounded border-border" checked={task.status === "done"} readOnly />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.action_label}</p>
                    <p className="text-xs text-muted-foreground">{task.source} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${structure?.color || 'bg-muted'}`} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{structure?.name || '-'}</span>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${actionTypeColors[task.action_type] || 'bg-muted text-muted-foreground'}`}>{task.action_type}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{task.due_date || '-'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Tasks;
