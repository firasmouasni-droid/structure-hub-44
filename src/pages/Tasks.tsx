import AppLayout from "@/components/layout/AppLayout";
import { mockTasks } from "@/data/mockData";
import { Plus, Filter, Search } from "lucide-react";
import { useState } from "react";

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

const Tasks = () => {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? mockTasks : mockTasks.filter(t => t.status === filter);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Tâches</h1>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            {[
              { key: "all", label: "Toutes" },
              { key: "todo", label: "À faire" },
              { key: "in_progress", label: "En cours" },
              { key: "done", label: "Terminées" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Task List */}
        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span></span>
            <span>Tâche</span>
            <span>Structure</span>
            <span>Type</span>
            <span>Priorité</span>
            <span>Échéance</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((task) => (
              <div key={task.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-accent/50 transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded border-border" checked={task.status === "done"} readOnly />
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.source} · {task.estimated_duration}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${task.structureColor}`} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{task.structure}</span>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${actionTypeColors[task.action_type]}`}>
                  {task.action_type}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                  task.priority === "high" ? "bg-destructive/10 text-destructive" :
                  task.priority === "medium" ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {task.priority}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{task.due_date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Tasks;
