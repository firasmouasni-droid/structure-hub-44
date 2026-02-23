import AppLayout from "@/components/layout/AppLayout";
import { mockInboxTasks } from "@/data/mockData";
import { Sparkles, Check, Pencil, Archive, Mail } from "lucide-react";

const InboxIA = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-ai flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inbox IA</h1>
            <p className="text-sm text-muted-foreground">{mockInboxTasks.length} tâches générées automatiquement</p>
          </div>
        </div>

        <div className="space-y-3">
          {mockInboxTasks.map((task) => (
            <div key={task.id} className="bg-card rounded-xl border border-border p-5 card-shadow hover:card-shadow-hover transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  task.email_id ? "bg-primary/10" : "bg-secondary/10"
                }`}>
                  {task.email_id ? <Mail className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-secondary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary`}>
                      IA
                    </span>
                    <div className={`w-2 h-2 rounded-full ${task.structureColor}`} />
                    <span className="text-xs text-muted-foreground">{task.structure}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{task.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Source : {task.source}</span>
                    <span>·</span>
                    <span>Échéance : {task.due_date}</span>
                    <span>·</span>
                    <span>Durée : {task.estimated_duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success text-success-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                    <Check className="w-3.5 h-3.5" />
                    Accepter
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default InboxIA;
